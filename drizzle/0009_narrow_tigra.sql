CREATE TABLE "todo_categories" (
	"todo_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "todo_categories_todo_id_category_id_pk" PRIMARY KEY("todo_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "todo_categories" ADD CONSTRAINT "todo_categories_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_categories" ADD CONSTRAINT "todo_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_categories_todo_id_idx" ON "todo_categories" USING btree ("todo_id");
--> statement-breakpoint
-- Backfill: bestehende Einzel-Zuweisung (todos.category_id) in die n:m-Tabelle uebernehmen
INSERT INTO "todo_categories" ("todo_id", "category_id")
SELECT "id", "category_id" FROM "todos"
WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;
