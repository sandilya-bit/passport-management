import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expectedTables = [
  'users', 'applicants', 'applications', 'documents', 'appointments',
  'payments', 'verifications', 'passports', 'refresh_tokens', 'password_resets',
];
const expectedTriggers = [
  'applications_status_transition_trigger',
  'appointments_sync_application_status_trigger',
  'passports_sync_application_status_trigger',
];
const expectedDatabaseRoutines = ['transition_application_status', 'issue_passport', 'confirm_payment'];

async function main() {
  await prisma.$connect();
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY(${expectedTables}::text[])
  `;
  const triggers = await prisma.$queryRaw<Array<{ tgname: string }>>`
    SELECT tgname FROM pg_trigger
    WHERE NOT tgisinternal AND tgname = ANY(${expectedTriggers}::text[])
  `;
  const routines = await prisma.$queryRaw<Array<{ proname: string }>>`
    SELECT proname FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = ANY(${expectedDatabaseRoutines}::text[])
  `;
  const extensions = await prisma.$queryRaw<Array<{ extname: string }>>`
    SELECT extname FROM pg_extension WHERE extname = 'btree_gist'
  `;
  const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    ORDER BY started_at DESC
  `;

  const missingTables = expectedTables.filter((name) => !tables.some((table) => table.table_name === name));
  const missingTriggers = expectedTriggers.filter((name) => !triggers.some((trigger) => trigger.tgname === name));
  const missingRoutines = expectedDatabaseRoutines.filter((name) => !routines.some((routine) => routine.proname === name));
  const initMigrationApplied = migrations.some((migration) => migration.migration_name === '20260928000000_init');
  const report = {
    tables: `${tables.length}/${expectedTables.length}`,
    triggers: `${expectedTriggers.length - missingTriggers.length}/${expectedTriggers.length}`,
    routines: `${expectedDatabaseRoutines.length - missingRoutines.length}/${expectedDatabaseRoutines.length}`,
    btreeGist: extensions.length > 0,
    initialMigrationApplied: initMigrationApplied,
    missingTables,
    missingTriggers,
    missingRoutines,
  };
  console.info(JSON.stringify(report, null, 2));

  if (missingTables.length || missingTriggers.length || missingRoutines.length || !extensions.length || !initMigrationApplied) {
    throw new Error('Database verification failed. Apply the latest Prisma migration and check database extension support.');
  }
  console.info('Database schema verification passed.');
}

void main()
  .catch((error) => {
    console.error('Database verification failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
