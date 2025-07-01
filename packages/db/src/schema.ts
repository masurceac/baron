import {
  EntityFlagEnum,
  SimulationExecutionStatus,
  TimeUnit,
  TradeDirection,
  TradeLogDirection,
  TradeResult,
  TradingPair,
} from '@baron/common';
import {
  AiModel,
  AiModelPriceStrategyEnum,
  AiModelStrategyEnum,
  PredefinedFrvpProfile,
} from '@baron/schema';
import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { type OpenOrderAiResponse } from '@baron/ai/order-suggestion';

export const predefinedFrvp = pgTable('predefined_frvp', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  name: text('name').notNull(),
  pair: text('pair', {
    enum: [...(Object.keys(TradingPair) as [TradingPair, ...TradingPair[]])],
  }).notNull(),
  lastDate: timestamp('last_date', { withTimezone: true }).notNull(),
  profiles: jsonb('profiles').notNull().$type<PredefinedFrvpProfile[]>(),
});

// bars that we send to AI for analysis
export const informativeBarConfig = pgTable('informative_bar_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  name: text('name').notNull(),
  timeframeUnit: text('timeframe_unit', {
    enum: [
      TimeUnit.Min,
      TimeUnit.Hour,
      TimeUnit.Day,
      TimeUnit.Week,
      TimeUnit.Month,
    ],
  }).notNull(),
  timeframeAmount: integer('timeframe_amount').notNull(),
  historicalBarsToConsiderAmount: integer(
    'historical_bars_to_consider_amount',
  ).notNull(),
  flag: text('flag', {
    enum: [EntityFlagEnum.Deafult],
  }),
});

export const simulationRoom = pgTable('simulation_room', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  name: text('name').notNull(),
  description: text('description'),

  startDate: timestamp('start_date', { withTimezone: true }).notNull(),

  groupIdentifier: text('group_identifier').notNull(),

  maxTradesToExecute: integer('max_trades_to_execute').notNull().default(10),
  pair: text('pair', {
    enum: [...(Object.keys(TradingPair) as [TradingPair, ...TradingPair[]])],
  }).notNull(),
  aiPrompt: text('ai_prompt').notNull(),

  authorName: text('author_name').notNull(),
  authorId: text('author_id').notNull(),

  predefinedFrvpId: text('predefined_frvp_id')
    .notNull()
    .references(() => predefinedFrvp.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  trailingStopLoss: boolean('trailing_stop_loss').notNull().default(false),
  crazyMode: boolean('crazy_mode').notNull().default(false),

  aiModels: jsonb('ai_models').notNull().$type<AiModel[]>(),
  aiModelStrategy: text('ai_model_strategy', {
    enum: [AiModelStrategyEnum.And, AiModelStrategyEnum.Or],
  })
    .notNull()
    .default(AiModelStrategyEnum.And),
  aiModelPriceStrategy: text('ai_model_price_strategy', {
    enum: [
      AiModelPriceStrategyEnum.Max,
      AiModelPriceStrategyEnum.Min,
      AiModelPriceStrategyEnum.Average,
    ],
  })
    .notNull()
    .default(AiModelPriceStrategyEnum.Max),

  bulkExecutionsCount: integer('bulk_executions_count').notNull().default(1),
  bulkExecutionsIntervalUnits: text('bulk_executions_interval_units', {
    enum: [...(Object.keys(TimeUnit) as [TimeUnit, ...TimeUnit[]])],
  })
    .notNull()
    .default(TimeUnit.Hour),
  bulkExecutionsIntervalAmount: integer('bulk_executions_interval_amount')
    .notNull()
    .default(1),

  status: text('status', {
    enum: [
      SimulationExecutionStatus.Pending,
      SimulationExecutionStatus.Running,
      SimulationExecutionStatus.Completed,
      SimulationExecutionStatus.Failed,
      SimulationExecutionStatus.LimitReached,
      SimulationExecutionStatus.Canceled,
    ],
  })
    .notNull()
    .default(SimulationExecutionStatus.Pending),
});

export const simulationRoomToInformativeBar = pgTable(
  'simulation_room_to_informative_bar',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),

    simulationRoomId: text('simulation_room_id')
      .notNull()
      .references(() => simulationRoom.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    informativeBarConfigId: text('informative_bar_config_id')
      .notNull()
      .references(() => informativeBarConfig.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
);

export const simulationExecution = pgTable('simulation_execution', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  name: text('name').notNull().default('n/a'),

  groupIdentifier: text('group_identifier').notNull(),
  trailingStopLoss: boolean('trailing_stop_loss'),
  crazyMode: boolean('crazy_mode').notNull().default(false),

  aiPrompt: text('ai_prompt').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),

  simulationRoomId: text('simulation_room_id')
    .notNull()
    .references(() => simulationRoom.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  status: text('status', {
    enum: [
      SimulationExecutionStatus.Pending,
      SimulationExecutionStatus.Running,
      SimulationExecutionStatus.Completed,
      SimulationExecutionStatus.Failed,
      SimulationExecutionStatus.LimitReached,
      SimulationExecutionStatus.Canceled,
    ],
  })
    .notNull()
    .default(SimulationExecutionStatus.Pending),
});

export const simulationExecutionToInformativeBarConfig = pgTable(
  'simulation_execution_to_informative_bar_config',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),

    simulationExecutionId: text('simulation_execution_id')
      .notNull()
      .references(() => simulationExecution.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    informativeBarConfigId: text('informative_bar_config_id')
      .notNull()
      .references(() => informativeBarConfig.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
);

export const simulationExecutionTrade = pgTable('simulation_execution_trade', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),

  simulationExecutionId: text('simulation_execution_id')
    .notNull()
    .references(() => simulationExecution.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  direction: text('direction', {
    enum: [TradeDirection.Buy, TradeDirection.Sell],
  }).notNull(),

  entryPrice: real('entry_price').notNull(),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),

  exitPrice: real('exit_price').notNull(),
  exitDate: timestamp('exit_date', { withTimezone: true }).notNull(),

  stopLossPrice: real('stop_loss_price').notNull(),
  takeProfitPrice: real('take_profit_price').notNull(),
  balanceResult: real('balance_result').notNull(),
  reason: text('reason'),

  status: text('status', {
    enum: [TradeResult.Success, TradeResult.Failure, TradeResult.Unknown],
  }).notNull(),
});

export const simulationExecutionLog = pgTable('simulation_execution_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  date: timestamp('date', { withTimezone: true }).notNull(),

  simulationExecutionId: text('simulation_execution_id')
    .notNull()
    .references(() => simulationExecution.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  direction: text('direction', {
    enum: [
      TradeLogDirection.Buy,
      TradeLogDirection.Sell,
      TradeLogDirection.Hold,
    ],
  }).notNull(),

  // trade id
  simulationExecutionTradeId: text('simulation_execution_trade_id').references(
    () => simulationExecutionTrade.id,
    {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
  ),

  reason: text('reason').notNull(),
  holdUntilPriceBreaksUp: real('hold_until_price_breaks_up'),
  holdUntilPriceBreaksDown: real('hold_until_price_breaks_down'),
});

export const liveTradingRoom = pgTable('live_trading_room', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  name: text('name').notNull(),

  pair: text('pair', {
    enum: [...(Object.keys(TradingPair) as [TradingPair, ...TradingPair[]])],
  }).notNull(),
  aiPrompt: text('ai_prompt').notNull(),

  status: text('status', {
    enum: [
      ...(Object.keys(SimulationExecutionStatus) as [
        SimulationExecutionStatus,
        ...SimulationExecutionStatus[],
      ]),
    ],
  })
    .notNull()
    .default(SimulationExecutionStatus.Pending),
  predefinedFrvpId: text('predefined_frvp_id')
    .notNull()
    .references(() => predefinedFrvp.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  aiModels: jsonb('ai_models').notNull().$type<AiModel[]>(),
  aiModelStrategy: text('ai_model_strategy', {
    enum: [AiModelStrategyEnum.And, AiModelStrategyEnum.Or],
  })
    .notNull()
    .default(AiModelStrategyEnum.And),
  aiModelPriceStrategy: text('ai_model_price_strategy', {
    enum: [
      AiModelPriceStrategyEnum.Max,
      AiModelPriceStrategyEnum.Min,
      AiModelPriceStrategyEnum.Average,
    ],
  })
    .notNull()
    .default(AiModelPriceStrategyEnum.Max),
});

export const liveTradingRoomToInformativeBarConfig = pgTable(
  'live_trading_room_to_informative_bar_config',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),

    liveTradingRoomId: text('live_trading_room_id')
      .notNull()
      .references(() => liveTradingRoom.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    informativeBarConfigId: text('informative_bar_config_id')
      .notNull()
      .references(() => informativeBarConfig.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
);

export const liveTradingRoomSignal = pgTable('live_trading_room_signal', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  liveTradingRoomId: text('live_trading_room_id')
    .notNull()
    .references(() => liveTradingRoom.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  suggestions: jsonb('suggestions').notNull().$type<OpenOrderAiResponse[]>(),

  exitDate: timestamp('exit_date', { withTimezone: true }),
  exitBalance: real('exit_balance'),
});

export const liveTradingRoomLog = pgTable('live_trading_room_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  liveTradingRoomId: text('live_trading_room_id')
    .notNull()
    .references(() => liveTradingRoom.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  suggestions: jsonb('suggestions').notNull().$type<OpenOrderAiResponse[]>(),
});

export const liveTradingRoomPushoverNotification = pgTable(
  'live_trading_room_pushover_notification',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    enabled: boolean('enabled').notNull().default(false),
    name: text('name').notNull(),
    liveTradingRoomId: text('live_trading_room_id')
      .notNull()
      .references(() => liveTradingRoom.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    signalsCount: integer('signals_count').notNull().default(1),
    pushoverUserKey: text('pushover_user_key').notNull(),
    pushoverAppToken: text('pushover_app_token').notNull(),
  },
);
