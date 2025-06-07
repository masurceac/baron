import { TimeUnit, TradingPair } from '@baron/common';
import { serve } from '@hono/node-server';
import { exec } from 'child_process';
import { Hono } from 'hono';
import { promisify } from 'util';
import { getFrvpProfilesWithDb } from './services/get-frvp-profiles-with-db';

const execPromise = promisify(exec);

const app = new Hono();
const BINANCE_API = 'https://api.binance.com';

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

app.get('/vpc', async (c) => {
  const search = new URLSearchParams(c.req.query());
  const end = new Date(search.get('end')!);
  const timeframeAmount = parseInt(search.get('timeframeAmount')!, 10);
  const timeframeUnit = search.get('timeframeUnit') as TimeUnit;
  const maxDeviationPercent = parseFloat(search.get('maxDeviationPercent')!);
  const minBarsToConsiderConsolidation = parseInt(
    search.get('minBarsToConsiderConsolidation')!,
    10,
  );
  const pair = search.get('pair')! as TradingPair;
  const volumePercentageRange = parseFloat(
    search.get('volumePercentageRange')!,
  );
  const currentPrice = parseFloat(search.get('currentPrice')!);
  const historicalBarsToConsider = parseInt(
    search.get('historicalBarsToConsider')!,
    10,
  );
  const result = await getFrvpProfilesWithDb({
    end,
    timeframeAmount,
    timeframeUnit,
    maxDeviationPercent,
    minBarsToConsiderConsolidation,
    pair,
    volumePercentageRange,
    currentPrice,
    historicalBarsToConsider,
  });

  if (!result) {
    return c.json({ error: 'No volume profile found' }, 404);
  }
  return c.json(result, 200);
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
