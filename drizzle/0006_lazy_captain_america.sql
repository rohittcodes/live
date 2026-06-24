CREATE TABLE "video_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"user_id" text NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "chat_settings" json DEFAULT '{"slowModeSeconds":null,"followersOnly":false,"wordFilters":[]}'::json;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "video_progress_unique" ON "video_progress" USING btree ("video_id","user_id");