CREATE TABLE "live_trading_room" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"pair" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"predefined_frvp_id" text NOT NULL,
	"ai_models" jsonb NOT NULL,
	"ai_model_strategy" text DEFAULT 'and' NOT NULL,
	"ai_model_price_strategy" text DEFAULT 'max' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_trading_room_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"live_trading_room_id" text NOT NULL,
	"suggestions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_trading_room_signal" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"live_trade_room_id" text NOT NULL,
	"suggestions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_trading_room_to_informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"live_trading_room_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "order_setup" CASCADE;--> statement-breakpoint
ALTER TABLE "live_trading_room" ADD CONSTRAINT "live_trading_room_predefined_frvp_id_predefined_frvp_id_fk" FOREIGN KEY ("predefined_frvp_id") REFERENCES "public"."predefined_frvp"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "live_trading_room_log" ADD CONSTRAINT "live_trading_room_log_live_trading_room_id_live_trading_room_id_fk" FOREIGN KEY ("live_trading_room_id") REFERENCES "public"."live_trading_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "live_trading_room_signal" ADD CONSTRAINT "live_trading_room_signal_live_trade_room_id_live_trading_room_id_fk" FOREIGN KEY ("live_trade_room_id") REFERENCES "public"."live_trading_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "live_trading_room_to_informative_bar_config" ADD CONSTRAINT "live_trading_room_to_informative_bar_config_live_trading_room_id_live_trading_room_id_fk" FOREIGN KEY ("live_trading_room_id") REFERENCES "public"."live_trading_room"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "live_trading_room_to_informative_bar_config" ADD CONSTRAINT "live_trading_room_to_informative_bar_config_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;