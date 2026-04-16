ALTER TABLE "admin_users" ADD COLUMN "banned_by" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banned_by" uuid;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "status" boolean DEFAULT true NOT NULL;