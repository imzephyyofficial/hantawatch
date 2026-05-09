CREATE TABLE "alert_dispatches" (
	"subscription_id" varchar(36) NOT NULL,
	"event_id" varchar(120) NOT NULL,
	"dispatched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(16) NOT NULL,
	"error" text,
	CONSTRAINT "alert_dispatches_subscription_id_event_id_pk" PRIMARY KEY("subscription_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"target_kind" varchar(16) NOT NULL,
	"target_id" varchar(120) NOT NULL,
	"body" text NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"name" varchar(80) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"prefix" varchar(12) NOT NULL,
	"scopes" jsonb DEFAULT '["read"]'::jsonb NOT NULL,
	"rate_limit_per_minute" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "source_fetch_log" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(24) NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(8) NOT NULL,
	"records_seen" integer,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"name" varchar(80) NOT NULL,
	"filter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"channel" varchar(16) NOT NULL,
	"target" text NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_dispatches" ADD CONSTRAINT "alert_dispatches_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "annotations_target_idx" ON "annotations" USING btree ("target_kind","target_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");