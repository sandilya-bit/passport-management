import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, allowedOrigins } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createRateLimiter } from './middleware/rate-limit';
import { asyncHandler } from './utils/async-handler';
import { ApiError } from './utils/api-error';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new ApiError(403, 'Origin is not allowed by CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use('/api/v1/webhooks/payment', express.raw({ type: 'application/json', limit: '64kb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(createRateLimiter('global', 300, 60));

app.get('/health', asyncHandler(async (_request, response) => {
  let database = 'unavailable';
  let schema = 'unavailable';
  let migration = 'unavailable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'ok';
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(ARRAY['users', 'applicants', 'applications', 'documents', 'appointments', 'payments', 'verifications', 'passports', 'refresh_tokens', 'password_resets'])
    `;
    schema = tables.length === 10 ? 'ok' : 'incomplete';
    const migrations = await prisma.$queryRaw<Array<{ applied: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE migration_name = '20260928000000_init'
          AND finished_at IS NOT NULL
          AND rolled_back_at IS NULL
      ) AS applied
    `;
    migration = migrations[0]?.applied ? 'ok' : 'pending';
  } catch {
    if (database === 'ok') migration = 'pending';
  }

  let redisStatus = 'disabled';
  if (redis) {
    try {
      redisStatus = redis.isReady ? ((await redis.ping()) === 'PONG' ? 'ok' : 'unavailable') : 'unavailable';
    } catch {
      redisStatus = 'unavailable';
    }
  }
  const healthy = database === 'ok' && schema === 'ok' && migration === 'ok' && (!env.REDIS_URL || redisStatus === 'ok');
  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database,
    schema,
    migration,
    redis: redisStatus,
  });
}));

app.get('/api/v1', (_request, response) => {
  response.json({ name: 'Passport Application Management API', version: 'v1', health: '/health' });
});
app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export async function connectInfrastructure() {
  if (redis && !redis.isOpen) {
    try {
      await redis.connect();
    } catch (error) {
      if (env.NODE_ENV === 'production') throw error;
      console.warn('Redis is unavailable; using the local rate-limit fallback.');
    }
  }
  try {
    await prisma.$connect();
  } catch (error) {
    if (env.NODE_ENV === 'production') throw error;
    console.warn('PostgreSQL is unavailable; API health will report degraded until it is started.');
  }
}