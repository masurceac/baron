DROP TABLE "simulation_execution_iteration" CASCADE;--> statement-breakpoint
ALTER TABLE "simulation_room" ADD COLUMN "ai_model_strategy" text DEFAULT 'and' NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_room" ADD COLUMN "ai_model_price_strategy" text DEFAULT 'max' NOT NULL;