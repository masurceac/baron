import {
  EntityFlagEnum,
  TimeUnit,
  TradeDirection,
  TradeLogDirection,
  TradingPair,
} from '@baron/common';
import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { SimulationExecutionStatus } from './enum';

export const zoneVolumeProfile = pgTable('zone_volume_profile', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),

  volumeAreaHigh: real('volume_area_high').notNull(),
  volumeAreaLow: real('volume_area_low').notNull(),
  pointOfControl: real('point_of_control').notNull(),

  zoneStartAt: timestamp('zone_start_at', { withTimezone: true }).notNull(),
  zoneEndAt: timestamp('zone_end_at', { withTimezone: true }).notNull(),

  tradingPair: text('trading_pair', {
    enum: [TradingPair.BTCUSDT, TradingPair.ETHUSDT],
  }).notNull(),

  timeUnit: text('time_interval', {
    enum: [
      TimeUnit.Min,
      TimeUnit.Hour,
      TimeUnit.Day,
      TimeUnit.Week,
      TimeUnit.Month,
    ],
  }).notNull(),
  timeAmount: integer('time_amount').notNull(),
  maxDeviationPercent: real('max_deviation_percent').notNull(),
  minimumBarsToConsider: integer('minimum_bars_to_consider').notNull(),
  volumeProfilePercentage: real('volume_profile_percentage').default(70),
});

export const volumeProfileConfig = pgTable(
  'volume_profile_config',
  {
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
    maxDeviationPercent: real('max_deviation_percent').notNull(),
    minimumBarsToConsider: integer('minimum_bars_to_consider').notNull(),
    historicalTimeToConsiderAmount: integer(
      'historical_time_to_consider_amount',
    ).notNull(),
    volumeProfilePercentage: real('volume_profile_percentage').default(70),
    flag: text('flag', {
      enum: [EntityFlagEnum.Deafult],
    }),
  },
  (table) => [
    unique().on(
      table.timeframeUnit,
      table.timeframeAmount,
      table.maxDeviationPercent,
      table.historicalTimeToConsiderAmount,
      table.volumeProfilePercentage,
    ),
  ],
);

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
  description: text('description').notNull(),

  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  tradesToExecute: integer('trades_to_execute').notNull().default(10),
  pair: text('pair', {
    enum: [TradingPair.BTCUSDT, TradingPair.ETHUSDT],
  }).notNull(),
  aiPrompt: text('ai_prompt').notNull(),
  trailingStop: boolean('trailing_stop').notNull(),
  authorName: text('author_name').notNull(),
  authorId: text('author_id').notNull(),
  selfTraining: boolean('is_self_training').notNull().default(false),
});

export const simulationRoomToVolumeProfileConfig = pgTable(
  'simulation_room_to_volume_profile_config',
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

    volumeProfileConfigId: text('volume_profile_config_id')
      .notNull()
      .references(() => volumeProfileConfig.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
);

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

  name: text('name').notNull(),
  pair: text('pair', {
    enum: [TradingPair.BTCUSDT, TradingPair.ETHUSDT],
  }).notNull(),
  aiPrompt: text('ai_prompt').notNull(),
  trailingStop: boolean('trailing_stop').notNull(),

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
    ],
  })
    .notNull()
    .default(SimulationExecutionStatus.Pending),

  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  tradesToExecute: integer('trades_to_execute').notNull().default(10),
  stepMinutes: integer('step_minutes').notNull().default(1),
});

export const simulationExecutionToVolumeProfileConfig = pgTable(
  'simulation_execution_to_volume_profile_config',
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

    volumeProfileConfigId: text('volume_profile_config_id')
      .notNull()
      .references(() => volumeProfileConfig.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
);

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
});
