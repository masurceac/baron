ALTER TABLE "simulation_room_execution" RENAME TO "simulation_execution";--> statement-breakpoint
ALTER TABLE "simulation_execution_iteration" DROP CONSTRAINT "simulation_execution_iteration_simulation_execution_id_simulation_room_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_execution_log" DROP CONSTRAINT "simulation_execution_log_simulation_execution_id_simulation_room_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" DROP CONSTRAINT "simulation_execution_to_informative_bar_config_simulation_execution_id_simulation_room_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_execution_trade" DROP CONSTRAINT "simulation_execution_trade_simulation_execution_id_simulation_room_execution_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_execution" DROP CONSTRAINT "simulation_room_execution_simulation_room_id_simulation_room_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_execution_iteration" ADD CONSTRAINT "simulation_execution_iteration_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_log" ADD CONSTRAINT "simulation_execution_log_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_to_informative_bar_config" ADD CONSTRAINT "simulation_execution_to_informative_bar_config_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution_trade" ADD CONSTRAINT "simulation_execution_trade_simulation_execution_id_simulation_execution_id_fk" FOREIGN KEY ("simulation_execution_id") REFERENCES "public"."simulation_execution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "simulation_execution" ADD CONSTRAINT "simulation_execution_simulation_room_id_simulation_room_id_fk" FOREIGN KEY ("simulation_room_id") REFERENCES "public"."simulation_room"("id") ON DELETE cascade ON UPDATE cascade;