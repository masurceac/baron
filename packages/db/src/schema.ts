import { TimeUnit, TradeDirection, TradingPair } from '@baron/common';
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
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),

  volumeAreaHigh: real('volume_area_high').notNull(),
  volumeAreaLow: real('volume_area_low').notNull(),
  pointOfControl: real('point_of_control').notNull(),

  zoneStartAt: timestamp('zone_start_at').notNull(),
  zoneEndAt: timestamp('zone_end_at').notNull(),

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
});

export const volumeProfileConfig = pgTable(
  'volume_profile_config',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
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
  },
  (table) => [unique().on(table.timeframeUnit, table.timeframeAmount)],
);

export const informativeBarConfig = pgTable('informative_bar_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
});

export const simulationRoom = pgTable('simulation_room', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  authorName: text('author_name').notNull(),
  authorId: text('author_id').notNull(),
});

export const simulationSetup = pgTable('simulation_setup', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
});

export const simulationExecution = pgTable('simulation_execution', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),

  simulationRoomId: text('simulation_room_id')
    .notNull()
    .references(() => simulationRoom.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  simulationSetupId: text('simulation_setup_id')
    .notNull()
    .references(() => simulationSetup.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  status: text('status', {
    enum: [
      SimulationExecutionStatus.Pending,
      SimulationExecutionStatus.Running,
      SimulationExecutionStatus.Completed,
    ],
  })
    .notNull()
    .default(SimulationExecutionStatus.Pending),

  tradesToExecute: integer('trades_to_execute').notNull().default(10),
});

export const simulationExecutionItem = pgTable('simulation_execution_item', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),

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
  entryDate: timestamp('entry_date').notNull(),

  exitPrice: real('exit_price').notNull(),
  exitDate: timestamp('exit_date').notNull(),

  stopLossPrice: real('stop_loss_price').notNull(),
  takeProfitPrice: real('take_profit_price').notNull(),
  balanceResult: real('balance_result').notNull(),
  reason: text('reason'),
});
