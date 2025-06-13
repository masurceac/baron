ALTER TABLE "simulation_execution" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" DROP COLUMN "status";