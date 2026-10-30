CREATE TYPE "public"."support_sender" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."support_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "support_status" DEFAULT 'open' NOT NULL,
	"admin_unread_count" integer DEFAULT 0 NOT NULL,
	"user_unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_preview" text,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_role" "support_sender" NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "support_conversations_user_idx" ON "support_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_conversations_last_message_idx" ON "support_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "support_messages_conversation_idx" ON "support_messages" USING btree ("conversation_id","created_at");