import { serve } from '@hono/node-server';
import { exec, spawn } from 'child_process';
import { Hono } from 'hono';
import { promisify } from 'util';
import { getEnv } from './async-storage';

const execPromise = promisify(exec);

const app = new Hono();
const BINANCE_API = 'https://api.binance.com';

app.get('/process', (c) => {
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

app.get('/binance/*', async (c) => {
  const search = new URLSearchParams(c.req.query());
  const url = `${BINANCE_API}${c.req.path.replace('/binance', '')}?${search.toString()}`;
  // Construct curl command with -s to suppress progress output
  const curlCommand = `curl -s "${url}"`;

  try {
    // Execute curl command
    const { stdout, stderr } = await execPromise(curlCommand);

    if (stderr) {
      console.error('curl stderr:', stderr);
      return c.json({ error: 'curl command failed' }, 500);
    }

    // Parse curl output (Binance API returns JSON)
    let responseData;
    try {
      responseData = JSON.parse(stdout);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return c.json({ error: 'Failed to parse curl response' }, 500);
    }

    // Send the response as JSON
    return c.json(responseData, 200);
  } catch (error) {
    console.error('Proxy error:', error);
    return c.json({ error: 'Proxy request failed' }, 500);
  }
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
