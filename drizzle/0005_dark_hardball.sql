CREATE TABLE "stream_clips" (
	"id" text PRIMARY KEY NOT NULL,
	"stream_id" text NOT NULL,
	"user_id" text,
	"label" text,
	"timestamp_seconds" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_poll_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"user_id" text,
	"option_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_polls" (
	"id" text PRIMARY KEY NOT NULL,
	"stream_id" text NOT NULL,
	"created_by" text NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stream_clips" ADD CONSTRAINT "stream_clips_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_clips" ADD CONSTRAINT "stream_clips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_poll_votes" ADD CONSTRAINT "stream_poll_votes_poll_id_stream_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."stream_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_poll_votes" ADD CONSTRAINT "stream_poll_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_polls" ADD CONSTRAINT "stream_polls_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_polls" ADD CONSTRAINT "stream_polls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stream_clips_stream_id_idx" ON "stream_clips" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "stream_poll_votes_poll_id_idx" ON "stream_poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "stream_polls_stream_id_idx" ON "stream_polls" USING btree ("stream_id");