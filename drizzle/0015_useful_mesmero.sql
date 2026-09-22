ALTER TABLE "todos" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_every" integer;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_unit" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "repeat_from" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;