ALTER TABLE "simulation_room" ADD COLUMN "is_self_training" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_execution" DROP COLUMN "system_prompt";--> statement-breakpoint
ALTER TABLE "simulation_room" DROP COLUMN "system_prompt";