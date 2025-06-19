import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://baron_owner:npg_9AE1yqZBGSTn@ep-raspy-sun-a2ob1pn7-pooler.eu-central-1.aws.neon.tech/baron?sslmode=require',
    // url: 'postgresql://postgres:postgrespw@localhost:55000/trade',
  },
});
