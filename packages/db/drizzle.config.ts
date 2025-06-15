import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // url: 'postgresql://dev_test_owner:npg_TBvMXmEj84tu@ep-nameless-hat-a21efhzo.eu-central-1.aws.neon.tech/dev_test?sslmode=require',
    url: 'postgresql://postgres:postgrespw@localhost:55000/trade',
  },
});
