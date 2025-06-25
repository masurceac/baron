CREATE TABLE "live_trading_room_pushover_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"live_trading_room_id" text NOT NULL,
	"signals_count" integer DEFAULT 1 NOT NULL,
	"pushover_user_key" text NOT NULL,
	"pushover_app_token" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_trading_room_pushover_notification" ADD CONSTRAINT "live_trading_room_pushover_notification_live_trading_room_id_live_trading_room_id_fk" FOREIGN KEY ("live_trading_room_id") REFERENCES "public"."live_trading_room"("id") ON DELETE cascade ON UPDATE cascade;