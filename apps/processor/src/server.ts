import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { getEnv } from './async-storage';
import { spawn } from 'child_process';
// Load environment variables from .env file

const app = new Hono();

app.get('/', (c) => {
  // spawn an sh script and run `npm run dev`in it
  const child = spawn('sh', ['-c', 'cd .. && npm run dev'], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('error', (err) => {
    console.error('Failed to start subprocess:', err);
  });
  child.on('exit', (code) => {
    console.log(`Subprocess exited with code ${code}`);
  });

  return c.text('Hello, Hono ' + getEnv().CLERK_PUBLISHABLE_KEY);
});
serve(
  {
    fetch: app.fetch,
    port: 4400,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  },
);
