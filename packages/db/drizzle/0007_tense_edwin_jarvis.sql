ALTER TABLE "live_trading_room_signal" RENAME COLUMN "live_trade_room_id" TO "live_trading_room_id";--> statement-breakpoint
ALTER TABLE "live_trading_room_signal" DROP CONSTRAINT "live_trading_room_signal_live_trade_room_id_live_trading_room_id_fk";
--> statement-breakpoint
ALTER TABLE "live_trading_room_signal" ADD CONSTRAINT "live_trading_room_signal_live_trading_room_id_live_trading_room_id_fk" FOREIGN KEY ("live_trading_room_id") REFERENCES "public"."live_trading_room"("id") ON DELETE cascade ON UPDATE cascade;