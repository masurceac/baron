import {
  EntityFlagEnum,
  SimulationExecutionStatus,
  TimeUnit,
  TradeDirection,
  TradeLogDirection,
  TradeResult,
  TradingPair,
  TradingPlatform,
  TradingStrategyStatus,
} from '@baron/common';
import {
  AiModel,
  AiModelPriceStrategyEnum,
  AiModelStrategyEnum,
  PredefinedFrvpProfile,
} from '@baron/schema';
import { createId } from '@paralleldrive/cuid2';
import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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

type BinancePlatformSetup = {
  type: 'binance';
  settings: {
    apiKey: string;
    apiSecret: string;
  };
};

export const orderSetup = pgTable('order_setup', {
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
  pair: text('pair', {
    enum: [TradingPair.BTCUSDT, TradingPair.ETHUSDT],
  }).notNull(),
  platform: text('platform', {
    enum: [TradingPlatform.Binance],
  }).notNull(),
  settings: jsonb('settings').notNull().$type<BinancePlatformSetup>(),
  status: text('status', {
    enum: [
      TradingStrategyStatus.Pending,
      TradingStrategyStatus.Running,
      TradingStrategyStatus.Stopped,
    ],
  })
    .notNull()
    .default(TradingStrategyStatus.Pending),
  leverage: integer('leverage').notNull().default(2),
  positionSizeUsd: integer('position_size_usd').notNull().default(10),
  aiPrompt: text('ai_prompt').notNull(),
});
