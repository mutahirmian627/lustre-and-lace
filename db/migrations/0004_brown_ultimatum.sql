CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'in_progress', 'won', 'closed');--> statement-breakpoint
CREATE TABLE "project_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"business_name" text NOT NULL,
	"industry" text,
	"services" text[] DEFAULT '{}' NOT NULL,
	"budget_range" text,
	"existing_website" text,
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "project_inquiries_status_created_idx" ON "project_inquiries" USING btree ("status","created_at");