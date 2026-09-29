import { app, connectInfrastructure } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

async function start() {
  const server = app.listen(env.PORT, () => console.info(`PAMS API listening on http://localhost:${env.PORT}`));

  try {
    await connectInfrastructure();
  } catch (error) {
    console.error('API dependencies are unavailable:', error);
    server.close(() => process.exit(1));
    return;
  }

  const shutdown = () => {
    server.close(async () => {
      await Promise.allSettled([prisma.$disconnect(), redis?.isOpen ? redis.quit() : Promise.resolve()]);
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void start().catch((error) => {
  console.error('API startup failed:', error);
  process.exit(1);
});