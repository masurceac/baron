CREATE TABLE "informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"timeframe_unit" text NOT NULL,
	"timeframe_amount" integer NOT NULL,
	"historical_bars_to_consider_amount" integer NOT NULL,
	"flag" text
);
--> statement-breakpoint
CREATE TABLE "order_setup" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" text NOT NULL,
	"pair" text NOT NULL,
	"platform" text NOT NULL,
	"settings" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"leverage" integer DEFAULT 2 NOT NULL,
	"position_size_usd" integer DEFAULT 10 NOT NULL,
	"ai_prompt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predefined_frvp" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"pair" text NOT NULL,
	"last_date" timestamp with time zone NOT NULL,
	"zones" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_iteration" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"direction" text NOT NULL,
	"simulation_execution_trade_id" text,
	"reason" text NOT NULL,
	"hold_until_price_breaks_up" real,
	"hold_until_price_breaks_down" real
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_to_informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_trade" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"simulation_execution_id" text NOT NULL,
	"direction" text NOT NULL,
	"entry_price" real NOT NULL,
	"entry_date" timestamp with time zone NOT NULL,
	"exit_price" real NOT NULL,
	"exit_date" timestamp with time zone NOT NULL,
	"stop_loss_price" real NOT NULL,
	"take_profit_price" real NOT NULL,
	"balance_result" real NOT NULL,
	"reason" text,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_room" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"max_trades_to_execute" integer DEFAULT 10 NOT NULL,
	"pair" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"author_name" text NOT NULL,
	"author_id" text NOT NULL,
	"predefined_frvp_id" text NOT NULL,
	"ai_models" jsonb NOT NULL,
	"bulk_executions_count" integer DEFAULT 1 NOT NULL,
	"bulk_executions_interval_units" text DEFAULT 'hour' NOT NULL,
	"bulk_executions_interval_amount" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_room_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"ai_prompt" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"simulation_room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_room_to_informative_bar" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_room_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulation_execution_iteration" ADD CONSTRAINT "simulation_execution_iteration_simulation_execution_id_simulation_room_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_room_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_log" ADD CONSTRAINT "simulation_execution_log_simulation_execution_id_simulation_room_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_room_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_log" ADD CONSTRAINT "simulation_execution_log_simulation_execution_trade_id_simulation_execution_trade_id_fk" FOREIGN KEY ("simulation_execution_trade_id") REFERENCES "public"."simulation_execution_trade"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" ADD CONSTRAINT "simulation_execution_to_informative_bar_config_simulation_execution_id_simulation_room_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_room_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" ADD CONSTRAINT "simulation_execution_to_informative_bar_config_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_trade" ADD CONSTRAINT "simulation_execution_trade_simulation_execution_id_simulation_room_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_room_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_room" ADD CONSTRAINT "simulation_room_predefined_frvp_id_predefined_frvp_id_fk" FOREIGN KEY ("predefined_frvp_id") REFERENCES "public"."predefined_frvp"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_room_execution" ADD CONSTRAINT "simulation_room_execution_simulation_room_id_simulation_room_id_fk" FOREIGN KEY ("simulation_room_id") REFERENCES "public"."simulation_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_room_to_informative_bar" ADD CONSTRAINT "simulation_room_to_informative_bar_simulation_room_id_simulation_room_id_fk" FOREIGN KEY ("simulation_room_id") REFERENCES "public"."simulation_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_room_to_informative_bar" ADD CONSTRAINT "simulation_room_to_informative_bar_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;