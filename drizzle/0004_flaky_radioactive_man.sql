ALTER TABLE "streams" ADD COLUMN "egress_id" text;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "recording_status" "recording_status";--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "recording_url" text;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_egress_id_unique" UNIQUE("egress_id");