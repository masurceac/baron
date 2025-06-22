import { serve } from '@hono/node-server';
import { exec } from 'child_process';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { promisify } from 'util';

const execPromise = promisify(exec);

const app = new Hono();
// Apply CORS middleware to all routes
app.use(
  '*',
  cors({
    origin: 'http://localhost:2300', // Allow requests from this origin
    allowHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    exposeHeaders: ['Content-Length'], // Headers exposed to the client
    maxAge: 600, // How long (in seconds) the preflight response can be cached
    credentials: true, // Allow cookies and credentials to be sent
  }),
);

const BINANCE_API = 'https://api.binance.com';
const ALPACA_API = 'https://data.alpaca.markets';

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

app.get('/alpaca/*', async (c) => {
  const search = new URLSearchParams(c.req.query());
  const url = `${ALPACA_API}${c.req.path.replace('/alpaca', '')}?${search.toString()}`;
  
  // Get headers from the request
  const headers = c.req.header();
  const alpacaHeaders = {
    'APCA-API-KEY-ID': headers['apca-api-key-id'],
    'APCA-API-SECRET-KEY': headers['apca-api-secret-key'],
    'Accept': 'application/json',
  };

  // Construct curl command with headers
  const headerArgs = Object.entries(alpacaHeaders)
    .filter(([_, value]) => value)
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(' ');
  
  const curlCommand = `curl -s ${headerArgs} "${url}"`;

  try {
    // Execute curl command
    const { stdout, stderr } = await execPromise(curlCommand);

    if (stderr) {
      console.error('curl stderr:', stderr);
      return c.json({ error: 'curl command failed' }, 500);
    }

    // Parse curl output (Alpaca API returns JSON)
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
