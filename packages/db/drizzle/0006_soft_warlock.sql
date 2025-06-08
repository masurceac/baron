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
	"ai_prompt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_setup_to_informative_bar_config" (
	"id" text PRIMARY KEY NOT NULL,
	"order_setup_id" text NOT NULL,
	"informative_bar_config_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_setup_to_volume_profile_config" (
	"id" text PRIMARY KEY NOT NULL,
	"order_setup_id" text NOT NULL,
	"volume_profile_config_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_setup_to_informative_bar_config" ADD CONSTRAINT "order_setup_to_informative_bar_config_order_setup_id_order_setup_id_fk" FOREIGN KEY ("order_setup_id") REFERENCES "public"."order_setup"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_setup_to_informative_bar_config" ADD CONSTRAINT "order_setup_to_informative_bar_config_informative_bar_config_id_informative_bar_config_id_fk" FOREIGN KEY ("informative_bar_config_id") REFERENCES "public"."informative_bar_config"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_setup_to_volume_profile_config" ADD CONSTRAINT "order_setup_to_volume_profile_config_order_setup_id_order_setup_id_fk" FOREIGN KEY ("order_setup_id") REFERENCES "public"."order_setup"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_setup_to_volume_profile_config" ADD CONSTRAINT "order_setup_to_volume_profile_config_volume_profile_config_id_volume_profile_config_id_fk" FOREIGN KEY ("volume_profile_config_id") REFERENCES "public"."volume_profile_config"("id") ON DELETE cascade ON UPDATE cascade;