CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_date" date NOT NULL,
	"type" uuid NOT NULL,
	"description" text,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "expenses_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_type_expenses_type_id_fk" FOREIGN KEY ("type") REFERENCES "public"."expenses_type"("id") ON DELETE no action ON UPDATE no action;