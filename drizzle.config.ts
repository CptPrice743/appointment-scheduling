import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/src/db/schema.ts',
  out: './server/d1/migrations',
  dialect: 'sqlite',
});
