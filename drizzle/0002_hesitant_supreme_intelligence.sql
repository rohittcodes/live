CREATE TYPE "public"."community_post_type" AS ENUM('post', 'announcement', 'update');--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"type" "community_post_type" DEFAULT 'post' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"image_urls" json DEFAULT '[]'::json,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "tags" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "is_members_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "tags" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "chapters" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_author_id_idx" ON "community_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "community_posts_published_idx" ON "community_posts" USING btree ("is_published","published_at");