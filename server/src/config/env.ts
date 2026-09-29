import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  DATABASE_URL: z.string().min(1).default('postgresql://pams:pams@localhost:5432/pams?schema=public'),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-before-production'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-before-production'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional()),
  PASSWORD_RESET_URL: z.string().url().optional(),
  PAYMENT_WEBHOOK_SECRET: z.preprocess((value) => value === '' ? undefined : value, z.string().min(32).optional()),
});

export const env = envSchema.parse(process.env);

if (env.NODE_ENV === 'production') {
  if (env.JWT_ACCESS_SECRET.startsWith('development-') || env.JWT_REFRESH_SECRET.startsWith('development-')) {
    throw new Error('Production JWT secrets must be explicitly configured.');
  }
  if (env.DATABASE_URL.includes('localhost:5432')) throw new Error('Production DATABASE_URL must point to the production database.');
  if (!env.REDIS_URL) throw new Error('Production REDIS_URL must be configured.');
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Production Cloudinary credentials must be configured.');
  }
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.PASSWORD_RESET_URL) {
    throw new Error('Production password-reset email settings must be configured.');
  }
  if (!env.PAYMENT_WEBHOOK_SECRET) throw new Error('Production PAYMENT_WEBHOOK_SECRET must be configured.');
}

export const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);