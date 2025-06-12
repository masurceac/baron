// import { API_KEYS } from '../env';
// import { TradingPair, TradeDirection } from '../types';

import { TradeDirection, TradingPair } from '@baron/common';

// Utility function to generate HMAC SHA256 signature
type BinanceKeys = {
  apiKey: string;
  apiSecret: string;
};
async function generateSignature(queryString: string, apiSecret: string) {
  const encoder = new TextEncoder();
  const key = encoder.encode(apiSecret);
  const message = encoder.encode(queryString);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Configuration
const baseUrl = 'https://fapi.binance.com';

// Function to make authenticated API requests
async function makeRequest(
  endpoint: string,
  method: string,
  params = {},
  keys: BinanceKeys,
) {
  const timestamp = Date.now();
  const queryString = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString(),
  }).toString();
  const signature = await generateSignature(queryString, keys.apiSecret);
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': keys.apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.msg} (Code: ${error.code})`);
  }
  return response.json();
}

// Step 1: Set Leverage
export async function setLeverage(options: {
  pair: TradingPair;
  leverage: number;
  keys: BinanceKeys;
}) {
  try {
    const result = await makeRequest(
      '/fapi/v1/leverage',
      'POST',
      {
        symbol: options.pair,
        leverage: options.leverage,
      },
      options.keys,
    );
    console.log('Leverage set:', result);
  } catch (error: any) {
    console.error('Error setting leverage:', error.message);
  }
}

// Step 2: Set Margin Type to Cross
export async function setMarginType(input: {
  pair: TradingPair;
  margin: 'ISOLATED' | 'CROSSED';
  keys: BinanceKeys;
}) {
  try {
    const result = await makeRequest(
      '/fapi/v1/marginType',
      'POST',
      {
        symbol: input.pair,
        marginType: input.margin,
      },
      input.keys,
    );
    console.log('Margin type set to CROSS:', result);
  } catch (error: any) {
    console.error('Error setting margin type:', error.message);
  }
}

export type BinanceOrder = {
  avgPrice: '0.00000';
  clientOrderId: 'abc';
  cumQuote: string;
  executedQty: string;
  orderId: number;
  origQty: '0.40';
  origType: 'TRAILING_STOP_MARKET';
  price: string;
  reduceOnly: false;
  side: 'BUY';
  positionSide: 'SHORT';
  status: 'NEW';
  stopPrice: '9300'; // please ignore when order type is TRAILING_STOP_MARKET
  closePosition: false; // if Close-All
  symbol: 'BTCUSDT';
  time: 1579276756075; // order time
  timeInForce: 'GTC';
  type: 'TRAILING_STOP_MARKET';
  activatePrice: '9020'; // activation price, only return with TRAILING_STOP_MARKET order
  priceRate: '0.3'; // callback rate, only return with TRAILING_STOP_MARKET order
  updateTime: 1579276756075; // update time
  workingType: 'CONTRACT_PRICE';
  priceProtect: false; // if conditional order trigger is protected
  priceMatch: 'NONE'; //price match mode
  selfTradePreventionMode: 'NONE'; //self trading preventation mode
  goodTillDate: 0; //order pre-set auot cancel time for TIF GTD order
};

export async function getFuturesOpenOrder(input: {
  pair: TradingPair;
  keys: BinanceKeys;
}): Promise<BinanceOrder | null> {
  try {
    const result: BinanceOrder[] = await makeRequest(
      '/fapi/v1/openOrders',
      'GET',
      {
        symbol: input.pair,
      },
      input.keys,
    );

    return result.find((i) => i.symbol === input.pair) || null;
  } catch (error: any) {
    console.error('Error fetching order details:', error.message);
    return null;
  }
}

export type BinancePosition = {
  symbol: 'ETHUSDT';
  positionSide: 'BOTH';
  positionAmt: '0.019';
  entryPrice: '2582.0';
  breakEvenPrice: '2582.5164';
  markPrice: '2582.72000000';
  unRealizedProfit: '0.01368000';
  liquidationPrice: '1296.70321285';
  isolatedMargin: '24.53286840';
  notional: '49.07168000';
  marginAsset: 'USDT';
  isolatedWallet: '24.51918840';
  initialMargin: '24.53584000';
  maintMargin: '0.19628672';
  positionInitialMargin: '24.53584000';
  openOrderInitialMargin: '0';
  adl: 1;
  bidNotional: '0';
  askNotional: '0';
  updateTime: 1748245321660;
};

export async function getFuturesPosition(input: {
  pair: TradingPair;
  keys: BinanceKeys;
}): Promise<BinancePosition | null> {
  try {
    const result: BinancePosition[] = await makeRequest(
      '/fapi/v3/positionRisk',
      'GET',
      {
        symbol: input.pair,
      },
      input.keys,
    );

    return result.find((i) => i.symbol === input.pair) || null;
  } catch (error: any) {
    console.error('Error fetching order details:', error.message);
    return null;
  }
}

// export async function openMarketFuturesOrder(input: {
//   pair: TradingPair;
//   quantity: number;
//   direction: TradeDirection;
//   keys: BinanceKeys;
// }) {
//   try {
//     const result = await makeRequest(
//       '/fapi/v1/order',
//       'POST',
//       {
//         symbol: input.pair,
//         side: input.direction === 'buy' ? 'BUY' : 'SELL',
//         type: 'MARKET',
//         quantity: input.quantity,
//       },
//       input.keys,
//     );
//     console.log('Order placed:', result);
//   } catch (error: any) {
//     console.error('Error placing order:', error.message);
//   }
// }

export async function openMarketFuturesOrderWithTPSL(input: {
  pair: TradingPair;
  quantity: number;
  direction: TradeDirection;
  takeProfitPrice: number; // Optional: Price for take-profit (e.g., 4000 for ETHUSDT BUY)
  stopLossPrice: number; // Optional: Price for stop-loss (e.g., 3000 for ETHUSDT BUY)
  keys: BinanceKeys;
}): Promise<BinanceOrder> {
  try {
    // Step 1: Place the main market order
    const marketOrder = await makeRequest(
      '/fapi/v1/order',
      'POST',
      {
        symbol: input.pair,
        side: input.direction === 'buy' ? 'BUY' : 'SELL',
        type: 'MARKET',
        quantity: input.quantity.toFixed(3), // Adjust precision as needed
      },
      input.keys,
    );
    console.log('Market order placed:', marketOrder);

    // Step 2: Place take-profit order (if provided)
    if (input.takeProfitPrice) {
      const tpSide = input.direction === 'buy' ? 'SELL' : 'BUY'; // Opposite side to close
      const tpOrder = await makeRequest(
        '/fapi/v1/order',
        'POST',
        {
          symbol: input.pair,
          side: tpSide,
          type: 'TAKE_PROFIT_MARKET',
          stopPrice: input.takeProfitPrice.toFixed(2), // Trigger price
          closePosition: 'true',
          priceProtect: 'true',
        },
        input.keys,
      );
      console.log('Take-profit order placed:', tpOrder);
    }

    // Step 3: Place stop-loss order (if provided)
    if (input.stopLossPrice) {
      const slSide = input.direction === 'buy' ? 'SELL' : 'BUY'; // Opposite side to close
      const slOrder = await makeRequest(
        '/fapi/v1/order',
        'POST',
        {
          symbol: input.pair,
          side: slSide,
          type: 'STOP_MARKET',
          stopPrice: input.stopLossPrice.toFixed(2), // Trigger price
          closePosition: 'true',
          priceProtect: 'true',
        },
        input.keys,
      );
      console.log('Stop-loss order placed:', slOrder);
    }

    return marketOrder;
  } catch (error: any) {
    console.error('Error placing order:', error.message);
    throw error;
  }
}

export async function cancelOrder(input: {
  pair: TradingPair;
  clientOrderId: string;
  keys: BinanceKeys;
}) {
  try {
    await makeRequest(
      '/fapi/v1/order',
      'DELETE',
      {
        symbol: input.pair,
        origClientOrderId: input.clientOrderId,
      },
      input.keys,
    );
    return true;
  } catch (error: any) {
    console.error('Error cancelling order:', error.message);
    return false;
  }
}

export async function getOpenOrders(input: {
  pair: TradingPair;
  keys: BinanceKeys;
}) {
  try {
    const orders = await makeRequest(
      '/fapi/v1/openOrders',
      'GET',
      {
        symbol: input.pair,
      },
      input.keys,
    );
    return orders;
  } catch (error: any) {
    console.error('Error fetching open orders:', error.message);
    return [];
  }
}

export async function closePosition({
  position,
  pair,
  keys,
}: {
  pair: TradingPair;
  position: BinancePosition;
  keys: BinanceKeys;
}) {
  try {
    // Get current position

    const numericAmount = parseFloat(position.positionAmt);
    const positionAmt = Math.abs(numericAmount).toFixed(3); // Adjust precision as needed
    const side = numericAmount > 0 ? 'SELL' : 'BUY'; // Opposite side to close

    // Place market order to close position
    const result = await makeRequest(
      '/fapi/v1/order',
      'POST',
      {
        symbol: pair,
        side,
        type: 'MARKET',
        quantity: positionAmt,
        reduceOnly: 'true',
      },
      keys,
    );
    console.log(`Position closed for ${pair}:`, result);
    return true;
  } catch (error: any) {
    console.error('Error closing position:', error.message);
    return false;
  }
}

export async function changeMarginType(input: {
  pair: TradingPair;
  marginType: 'CROSSED' | 'ISOLATED';
  keys: BinanceKeys;
}): Promise<void> {
  try {
    const result = await makeRequest(
      '/fapi/v1/marginType',
      'POST',
      {
        symbol: input.pair,
        marginType: input.marginType,
      },
      input.keys,
    );
    console.log('Margin type changed:', result);
  } catch (error: any) {
    console.error('Error changing margin type:', error.message);
  }
}
