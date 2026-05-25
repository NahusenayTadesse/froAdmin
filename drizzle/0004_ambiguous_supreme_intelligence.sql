ALTER TABLE "expenses" DROP CONSTRAINT "expenses_type_admin_users_id_fk";
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;