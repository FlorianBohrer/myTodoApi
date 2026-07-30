CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	CONSTRAINT "device_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"todo_id" uuid,
	"todo_title" text NOT NULL,
	"planned_seconds" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"running_since" timestamp,
	"ended_at" timestamp,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairing_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_token_user_id_idx" ON "device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_token_hash_idx" ON "device_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "focus_session_user_id_idx" ON "focus_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "focus_session_started_at_idx" ON "focus_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "pairing_code_user_id_idx" ON "pairing_codes" USING btree ("user_id");