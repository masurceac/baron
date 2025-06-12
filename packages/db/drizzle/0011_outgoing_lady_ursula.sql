CREATE TABLE "order_setup_log" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order_setup_id" text NOT NULL,
	"direction" text NOT NULL,
	"reason" text NOT NULL,
	"current_price" real NOT NULL,
	"take_profit_price" real NOT NULL,
	"stop_loss_price" real NOT NULL,
	"remote_order_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_setup_log" ADD CONSTRAINT "order_setup_log_order_setup_id_order_setup_id_fk" FOREIGN KEY ("order_setup_id") REFERENCES "public"."order_setup"("id") ON DELETE cascade ON UPDATE cascade;