ALTER TYPE "public"."role" ADD VALUE 'super_admin';--> statement-breakpoint
CREATE TABLE "role_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_user_id" uuid,
	"target_email" text NOT NULL,
	"actor_user_id" uuid,
	"actor_email" text NOT NULL,
	"from_role" "role" NOT NULL,
	"to_role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_audit_log" ADD CONSTRAINT "role_audit_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_audit_log" ADD CONSTRAINT "role_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_audit_log_created_idx" ON "role_audit_log" USING btree ("created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_single_super_admin() RETURNS trigger AS $$
BEGIN
	IF NEW.role::text = 'super_admin' THEN
		PERFORM pg_advisory_xact_lock(7140001);
		IF EXISTS (SELECT 1 FROM "user" WHERE role::text = 'super_admin' AND id <> NEW.id) THEN
			RAISE EXCEPTION 'There can only be one super admin';
		END IF;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER user_single_super_admin
	BEFORE INSERT OR UPDATE OF role ON "user"
	FOR EACH ROW EXECUTE FUNCTION enforce_single_super_admin();
