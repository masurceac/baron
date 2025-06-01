CREATE TABLE "informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"timeframe_unit" text NOT NULL,
	"timeframe_amount" integer NOT NULL,
	"historical_bars_to_consider_amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "informative_bar_config_to_simulation_setup" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_setup_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"pair" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"system_prompt" text NOT NULL,
	"trailing_stop" boolean NOT NULL,
	"simulation_room_id" text NOT NULL,
	"simulation_setup_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"start_date" timestamp NOT NULL,
	"trades_to_execute" integer DEFAULT 10 NOT NULL,
	"step_minutes" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date" timestamp NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"direction" text NOT NULL,
	"simulation_execution_trade_id" text,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_to_informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_to_volume_profile_config" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"volume_profile_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_execution_trade" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"simulation_execution_id" text NOT NULL,
	"direction" text NOT NULL,
	"entry_price" real NOT NULL,
	"entry_date" timestamp NOT NULL,
	"exit_price" real NOT NULL,
	"exit_date" timestamp NOT NULL,
	"stop_loss_price" real NOT NULL,
	"take_profit_price" real NOT NULL,
	"balance_result" real NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "simulation_room" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"author_name" text NOT NULL,
	"author_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_setup" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pair" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"system_prompt" text NOT NULL,
	"trailing_stop" boolean NOT NULL,
	"simulation_room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volume_profile_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"timeframe_unit" text NOT NULL,
	"timeframe_amount" integer NOT NULL,
	"max_deviation_percent" real NOT NULL,
	"minimum_bars_to_consider" integer NOT NULL,
	"historical_time_to_consider_amount" integer NOT NULL,
	"volume_profile_percentage" real DEFAULT 70,
	CONSTRAINT "volume_profile_config_timeframe_unit_timeframe_amount_max_deviation_percent_historical_time_to_consider_amount_volume_profile_percentage_unique" UNIQUE("timeframe_unit","timeframe_amount","max_deviation_percent","historical_time_to_consider_amount","volume_profile_percentage")
);
--> statement-breakpoint
CREATE TABLE "volume_profile_config_to_simulation_setup" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_setup_id" text NOT NULL,
	"volume_profile_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zone_volume_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"volume_area_high" real NOT NULL,
	"volume_area_low" real NOT NULL,
	"point_of_control" real NOT NULL,
	"zone_start_at" timestamp NOT NULL,
	"zone_end_at" timestamp NOT NULL,
	"trading_pair" text NOT NULL,
	"time_interval" text NOT NULL,
	"time_amount" integer NOT NULL,
	"max_deviation_percent" real NOT NULL,
	"minimum_bars_to_consider" integer NOT NULL,
	"volume_profile_percentage" real DEFAULT 70
);
--> statement-breakpoint
ALTER TABLE "informative_bar_config_to_simulation_setup" ADD CONSTRAINT "informative_bar_config_to_simulation_setup_simulation_setup_id_simulation_setup_id_fk" FOREIGN KEY ("simulation_setup_id") REFERENCES "public"."simulation_setup"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "informative_bar_config_to_simulation_setup" ADD CONSTRAINT "informative_bar_config_to_simulation_setup_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution" ADD CONSTRAINT "simulation_execution_simulation_room_id_simulation_room_id_fk" FOREIGN KEY ("simulation_room_id") REFERENCES "public"."simulation_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution" ADD CONSTRAINT "simulation_execution_simulation_setup_id_simulation_setup_id_fk" FOREIGN KEY ("simulation_setup_id") REFERENCES "public"."simulation_setup"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_log" ADD CONSTRAINT "simulation_execution_log_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_log" ADD CONSTRAINT "simulation_execution_log_simulation_execution_trade_id_simulation_execution_trade_id_fk" FOREIGN KEY ("simulation_execution_trade_id") REFERENCES "public"."simulation_execution_trade"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" ADD CONSTRAINT "simulation_execution_to_informative_bar_config_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" ADD CONSTRAINT "simulation_execution_to_informative_bar_config_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_volume_profile_config" ADD CONSTRAINT "simulation_execution_to_volume_profile_config_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_volume_profile_config" ADD CONSTRAINT "simulation_execution_to_volume_profile_config_volume_profile_config_id_volume_profile_config_id_fk" FOREIGN KEY ("volume_profile_config_id") REFERENCES "public"."volume_profile_config"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_trade" ADD CONSTRAINT "simulation_execution_trade_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_setup" ADD CONSTRAINT "simulation_setup_simulation_room_id_simulation_room_id_fk" FOREIGN KEY ("simulation_room_id") REFERENCES "public"."simulation_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volume_profile_config_to_simulation_setup" ADD CONSTRAINT "volume_profile_config_to_simulation_setup_simulation_setup_id_simulation_setup_id_fk" FOREIGN KEY ("simulation_setup_id") REFERENCES "public"."simulation_setup"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volume_profile_config_to_simulation_setup" ADD CONSTRAINT "volume_profile_config_to_simulation_setup_volume_profile_config_id_volume_profile_config_id_fk" FOREIGN KEY ("volume_profile_config_id") REFERENCES "public"."volume_profile_config"("id") ON DELETE cascade ON UPDATE cascade;