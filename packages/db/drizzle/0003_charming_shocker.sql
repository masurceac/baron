CREATE TABLE "simulation_execution_iteration" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_execution_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulation_execution_iteration" ADD CONSTRAINT "simulation_execution_iteration_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;