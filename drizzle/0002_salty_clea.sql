ALTER TABLE "todos" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;