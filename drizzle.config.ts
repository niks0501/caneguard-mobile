import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/compatibilitySpikeSchema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
});
