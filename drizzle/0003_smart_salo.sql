DROP INDEX "todo_user_id_idx";--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;