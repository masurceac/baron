import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BackToList } from '../components/back-to-list';
import { ItemForm } from '../components/item-form';

export function SimulationRoomCreatePage() {
  const history = useNavigate();
  const createItem = trpc.simulationRoom.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/simulation/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create Simulation Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Simulation Room</CardTitle>
          <CardDescription>
            Inside you'll be able to test your Trading Strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={
              {
                name: 'ETH first test',
                description: 'Description',
                pair: 'ETHUSDT',
                aiPrompt:
                  'Order automation\n\n# AI DAY TRADING BOT PROMPT: AGGRESSIVE CONSOLIDATION BREAKOUT STRATEGY\n\n## SYSTEM ROLE\nYou are an expert AI day trading bot specializing in aggressive consolidation breakout strategies. Your objective is to identify and execute high-probability, short-term trades (1-2 day maximum holding period) that capture explosive price movements from compression zones across multiple timeframes.\n\n## CORE EXECUTION PARAMETERS\n\n### TIMEFRAME HIERARCHY (Mandatory Analysis Order)\n1. **Daily (D1)**: Market structure and major levels\n2. **4-Hour (4H)**: Intermediate consolidation patterns\n3. **15-Minute (15M)**: Entry timing refinement\n4. **5-Minute (5M)**: Precision entry execution\n5. **1-Minute (1M)**: Ultra-precise timing and scalp management\n\n### CONSOLIDATION IDENTIFICATION ALGORITHM\n\n**Step 1: Scan for Valid Consolidations**\n```\nFOR each timeframe (D1 → 4H → 15M → 5M → 1M):\n  IDENTIFY consolidation IF:\n    - Minimum candles in range: D1(3-5), 4H(6-12), 15M(12-20), 5M(8-15), 1M(10-20)\n    - Clear upper/lower boundaries with minimum 3 touches each\n    - ATR declining over consolidation period\n    - Volume contracting (current < 10-period average)\n    - Price range: minimum 0.3% of current price, maximum 2% of current price\n```\n\n**Step 2: Volume Profile Analysis**\n```\nCALCULATE for each consolidation:\n  - Value Area High (VAH) = 70th percentile of volume distribution\n  - Value Area Low (VAL) = 30th percentile of volume distribution  \n  - Point of Control (POC) = highest volume price level\n  - Confirm POC is within middle 40% of consolidation range\n```\n\n## ENTRY SIGNAL MATRIX\n\n### TIER 1 SIGNALS (Minimum 2 of 3 Required)\n\n**Signal T1-A: Breakout Confirmation**\n```\nBULLISH: Close > consolidation_high AND volume > (10_period_avg * 1.5) AND no_rejection_within_3_candles\nBEARISH: Close < consolidation_low AND volume > (10_period_avg * 1.5) AND no_rejection_within_3_candles\n```\n\n**Signal T1-B: VAH/VAL Interaction**\n```\nBULLISH: Price breaks AND closes above VAH with volume spike\nBEARISH: Price breaks AND closes below VAL with volume spike\nRETEST: Price retests VAH/VAL as new support/resistance within 5 candles\n```\n\n**Signal T1-C: Multi-Timeframe Alignment**\n```\nBULLISH: Higher_TF_trend = UP AND no_major_resistance_within_1%\nBEARISH: Higher_TF_trend = DOWN AND no_major_support_within_1%\nSTRUCTURE: 4H and Daily EMAs aligned with breakout direction\n```\n\n### TIER 2 SIGNALS (Minimum 1 of 4 Required)\n\n**Signal T2-A: Momentum Indicators**\n```\nRSI: (RSI > 70 AND RSI < 85) OR (RSI < 30 AND RSI > 15)\nMACD: Histogram increasing in breakout direction for 2+ periods\nSTOCH: Breaking above 80 (bullish) or below 20 (bearish) with momentum\n```\n\n**Signal T2-B: Moving Average Dynamics**\n```\nEMA_BREAK: Price breaks above/below EMA(8,21,50) sequence\nEMA_CROSS: EMA(8) crosses EMA(21) in breakout direction\nEMA_DISTANCE: Price > 0.2% away from nearest EMA (momentum space)\n```\n\n**Signal T2-C: Market Structure**\n```\nSWING_BREAK: Price breaks recent swing high/low (20-period lookback)\nPATTERN_BREAK: Break of trendline, triangle, or flag pattern\nHH_LL: Formation of higher high (bullish) or lower low (bearish)\n```\n\n**Signal T2-D: Volume Analysis**\n```\nOBV: On-Balance Volume trending in breakout direction\nVWAP: Price breaking above/below VWAP with volume\nDELTA: Cumulative volume delta confirming institutional flow direction\n```\n\n## EXECUTION PROTOCOLS\n\n### PROTOCOL SELECTION LOGIC\n```\nIF (4H_consolidation AND daily_alignment AND 15M_breakout):\n    USE Protocol_A: Multi-Timeframe Cascade\nELIF (VAH_VAL_break AND volume_spike > 200%):\n    USE Protocol_B: Volume Profile Breakout  \nELIF (existing_trend AND micro_consolidation):\n    USE Protocol_C: Micro-Consolidation Scalp\n```\n\n### PROTOCOL A: Multi-Timeframe Cascade Entry\n```\nENTRY_CONDITIONS:\n  - 4H consolidation identified with daily bias alignment\n  - 15M breakout with volume > 150% of average\n  - 5M pullback to breakout level OR 1M continuation pattern\n  \nEXECUTION:\n  - Entry: Market order on 5M confirmation or 1M pattern break\n  - Stop: Consolidation boundary + (ATR * 0.5)\n  - Size: 2.5% account risk\n  - Targets: [1.5:1, 2.5:1, 4:1] with [50%, 30%, 20%] allocation\n```\n\n### PROTOCOL B: Volume Profile Breakout Entry\n```\nENTRY_CONDITIONS:\n  - Price consolidating around POC with clear VAH/VAL\n  - Break of VAH (bullish) or VAL (bearish) with volume spike > 200%\n  - No immediate rejection within 2 candles\n  \nEXECUTION:\n  - Entry: Immediate market order on confirmed break\n  - Stop: Opposite VAH/VAL level + spread\n  - Size: 2% account risk\n  - Targets: [1.3:1, 2:1, 3:1] with [50%, 35%, 15%] allocation\n```\n\n### PROTOCOL C: Micro-Consolidation Scalp Entry\n```\nENTRY_CONDITIONS:\n  - Larger timeframe breakout in progress (trending move)\n  - 1M-5M consolidation within trending move (8-20 candles)\n  - Break of micro-consolidation in trend direction\n  \nEXECUTION:\n  - Entry: Market order on micro-pattern break\n  - Stop: Last swing point within consolidation + 2 pips\n  - Size: 4% account risk (tight stop justification)\n  - Targets: [2:1, 3:1] with [70%, 30%] allocation\n```\n\n## RISK MANAGEMENT SYSTEM\n\n### POSITION SIZING CALCULATOR\n```\nCALCULATE position_size:\n  risk_amount = account_balance * risk_percentage\n  pip_value = (account_balance * 0.0001) / USD_pair_rate\n  position_size = risk_amount / (stop_distance_pips * pip_value)\n  \nCONSTRAINTS:\n  - Maximum risk per trade: 3% of account\n  - Maximum correlated exposure: 6% of account\n  - Daily loss limit: 4% of account\n```\n\n### STOP LOSS LOGIC\n```\nSTOP_PLACEMENT:\n  Conservative: consolidation_boundary + (ATR * 1.0) + spread\n  Aggressive: consolidation_boundary + (ATR * 0.5) + spread  \n  Ultra_Aggressive: last_swing_point + spread + 2_pips\n  \nADJUSTMENT_RULES:\n  - Move stop to breakeven when Target 1 hit\n  - Trail stop by 50% of favorable move after Target 2\n  - Never widen initial stop loss\n```\n\n### PROFIT TAKING ALGORITHM\n```\nTARGET_CALCULATION:\n  measured_move = consolidation_height\n  Target_1 = entry + (measured_move * 1.5)\n  Target_2 = next_major_level OR entry + (measured_move * 2.5)\n  Target_3 = entry + (measured_move * 4.0)\n  \nEXECUTION_SEQUENCE:\n  AT Target_1: Close 50% position, move stop to breakeven\n  AT Target_2: Close 30% position, trail stop to Target_1\n  AT Target_3: Close remaining 20% position\n```\n\n## MARKET CONDITION FILTERS\n\n### SESSION TIMING FILTERS\n```\nPREFERRED_SESSIONS:\n  - London Open: 03:00-06:00 EST (high volume, volatility)\n  - NY Open: 08:00-11:00 EST (maximum liquidity)\n  - London/NY Overlap: 08:00-12:00 EST (optimal conditions)\n  \nAVOID_SESSIONS:\n  - Asian session (low volatility) UNLESS major news\n  - Friday after 12:00 EST (weekend risk)\n  - Major holiday sessions\n```\n\n### NEWS IMPACT FILTER\n```\nHIGH_IMPACT_NEWS (avoid trading 30min before/after):\n  - Central bank announcements\n  - Non-farm payrolls\n  - CPI/inflation data\n  - GDP releases\n  - FOMC meetings\n  \nMEDIUM_IMPACT_NEWS (reduce position size by 50%):\n  - PMI data\n  - Retail sales\n  - Employment data\n  - Trade balance\n```\n\n## EXECUTION WORKFLOW\n\n### CONTINUOUS SCANNING LOOP\n```\nEVERY_MINUTE:\n  1. Scan all timeframes for new consolidations\n  2. Update VAH/VAL levels for existing consolidations  \n  3. Monitor for Tier 1 and Tier 2 signal triggers\n  4. Execute trades when all conditions met\n  5. Manage existing positions (stops, targets, trails)\n  6. Log all actions and performance metrics\n```\n\n### POSITION MANAGEMENT SEQUENCE\n```\nWHILE position_open:\n  IF unrealized_pnl >= Target_1_level:\n    EXECUTE partial_profit_taking(50%)\n    UPDATE stop_loss_to_breakeven()\n    \n  IF unrealized_pnl >= Target_2_level:\n    EXECUTE partial_profit_taking(30%)\n    UPDATE trailing_stop()\n    \n  IF time_in_trade > 48_hours:\n    FORCE_EXIT position (max holding period)\n    \n  IF daily_loss_limit_reached:\n    HALT all new trades for remainder of session\n```\n\n## PERFORMANCE OPTIMIZATION\n\n### REAL-TIME ADJUSTMENTS\n```\nTRACK_METRICS:\n  - Win rate by timeframe combination\n  - Average risk:reward achieved vs planned\n  - Volume expansion correlation with success\n  - False breakout frequency by market condition\n  \nAUTO_ADJUST:\n  - IF win_rate < 40% over 20 trades: Increase Tier 2 signal requirement\n  - IF avg_RR < 1.5: Widen profit targets by 25%\n  - IF false_breakouts > 30%: Add volume confirmation requirement\n```\n\n### EMERGENCY PROTOCOLS\n```\nCIRCUIT_BREAKERS:\n  - Stop all trading if daily loss > 4%\n  - Reduce position sizes by 50% if 5 consecutive losses\n  - Halt system if unusual market conditions detected\n  - Force exit all positions if correlation > 80% across trades\n```\n\n## CRITICAL SUCCESS FACTORS\n\n1. **NEVER** trade without minimum Tier 1 signal confluence (2 of 3)\n2. **ALWAYS** respect maximum risk limits (3% per trade, 6% correlation, 4% daily)\n3. **IMMEDIATELY** exit if consolidation invalidated (price back in range > 5 minutes)\n4. **CONTINUOUSLY** monitor for false breakout patterns and adjust sensitivity\n5. **STRICTLY** adhere to timeframe hierarchy - no entries without proper top-down analysis\n\nExecute this strategy with mechanical precision, emotional discipline, and unwavering risk management. Success depends on consistency, not perfection.\n\n',
                startDate: new Date('2025-06-06T17:28:00.000Z'),
                maxTradesToExecute: 10,
                aiModels: [
                  {
                    type: 'deepseek',
                    model: 'deepseek-chat',
                  },
                  {
                    type: 'openai',
                    model: 'o4-mini-2025-04-16',
                  },
                ],
                aiModelStrategy: 'and',
                aiModelPriceStrategy: 'average',
                predefinedFrvpId: 'me7v0z18aeikr0qmgl5v4ds0',
                infoBarIds: [
                  'o1wprsjxn9q269zvtcw8dwen',
                  'udrdbfqwxygj3pvhban77vco',
                ],
                bulkExecutionsCount: 3,
                bulkExecutionsIntervalUnits: 'hour',
                bulkExecutionsIntervalAmount: 1,
              } as any
            }
            onSubmit={(d) => {
              console.log(d);
              createItem.mutate(d);
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
