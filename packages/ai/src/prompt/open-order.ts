import { GetAllVariables } from './types';

export const OPEN_ORDER_PROMPT =
  `You will receive structured market data, including support/resistance zones across multiple timeframes and recent OHLCV data.

Your task is to analyze the data and respond with a **day trade** if such opportunity exists.

Guidelines:

- **Actively seek directional setups**, especially when there's a clear short-term trend confirmed by volume, VWAP alignment, and recent breakout or breakdown behavior.
- **Use medium risk management**:
  - Avoid excessive stop distances or unrealistic profit targets
- **Choose to trade especially when**:
  - Price breaking or rejecting key levels (e.g. VAH, VAL, POC) with rising volume
  - Short-term VWAP slope and price behavior matching higher timeframe bias
  - When trend is strong (momentum confirmed across timeframes), **favor continuation setups** (e.g. pullback entries).
- Do not suggest contrarian trades against a strong trend. 
- If **no potential protifable setup**, suggest to **hold**

Here is the market data:
\`\`\`json
{{json_input}}
\`\`\`

Your response should follow this JSON-org schema:
\`\`\`json
{{response_schema}}
\`\`\`
` as const;

export const OPEN_ORDER_SYSTEM_PROMPT =
  `You are trading {{trading_pair}} and you have expertise into trading it profitably.` as const;

export type OpenOrderVariables = GetAllVariables<typeof OPEN_ORDER_PROMPT>;
export type OpenOrderSystemVariables = GetAllVariables<
  typeof OPEN_ORDER_SYSTEM_PROMPT
>;
