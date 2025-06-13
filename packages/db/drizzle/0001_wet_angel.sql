ALTER TABLE "predefined_frvp" ADD COLUMN "profiles" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "predefined_frvp" DROP COLUMN "zones";