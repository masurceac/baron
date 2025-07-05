import { fetchPolygonBars } from './fetch-polygon-bars';

async function test() {
  const r = await fetchPolygonBars({
    start: new Date('2025-06-16T11:24:41.133Z'),
    end: new Date('2025-06-16T13:00:41.133Z'),
    timeframeAmount: 15,
    timeframeUnit: 'min',
    pair: 'XAUUSD',
    alpaca: {
      keyId: 'PKLSQ6SG3WUEQERUJ2HO',
      secretKey: 'w5Ce85d1xR91e8Jxm7myvfZDYk2qWBMrFab94xCW',
    },
    polygon: { keyId: 'BtZuK74Aghrhgo_xbBldnVF9tnlRDxdV' },
  } as any);
  console.log(r);
}

test();
