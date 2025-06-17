ALTER TABLE "simulation_execution" ADD COLUMN "group_identifier" text;--> statement-breakpoint
UPDATE "simulation_execution" SET "group_identifier" = "simulation_room"."name" FROM "simulation_room" WHERE "simulation_execution"."simulation_room_id" = "simulation_room"."id";--> statement-breakpoint
ALTER TABLE "simulation_execution" ALTER COLUMN "group_identifier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_execution" ADD COLUMN "trailing_stop_loss" boolean;--> statement-breakpoint
ALTER TABLE "simulation_room" ADD COLUMN "group_identifier" text;--> statement-breakpoint
UPDATE "simulation_room" SET "group_identifier" = "simulation_room"."name";--> statement-breakpoint
ALTER TABLE "simulation_room" ALTER COLUMN "group_identifier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_room" ADD COLUMN "trailing_stop_loss" boolean DEFAULT false NOT NULL;