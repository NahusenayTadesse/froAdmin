ALTER TABLE "admin_users" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "banned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banned_at" timestamp with time zone;