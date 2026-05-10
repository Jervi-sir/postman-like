CREATE TABLE "global_variables" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"variables_text" text DEFAULT '{}' NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text,
	"method" text NOT NULL,
	"url" text NOT NULL,
	"status_code" integer,
	"duration_ms" integer NOT NULL,
	"response_headers_json" text DEFAULT '{}' NOT NULL,
	"response_body_text" text DEFAULT '' NOT NULL,
	"error_text" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"body_text" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group_name" text DEFAULT '' NOT NULL,
	"sub_group_name" text DEFAULT '' NOT NULL,
	"method" text NOT NULL,
	"url" text NOT NULL,
	"headers_json" text DEFAULT '{}' NOT NULL,
	"query_json" text DEFAULT '{}' NOT NULL,
	"body_text" text DEFAULT '' NOT NULL,
	"use_global_bearer" integer DEFAULT 0 NOT NULL,
	"response_status" integer,
	"response_status_text" text DEFAULT '' NOT NULL,
	"response_duration_ms" integer,
	"response_headers_json" text DEFAULT '{}' NOT NULL,
	"response_body_text" text DEFAULT '' NOT NULL,
	"response_url" text DEFAULT '' NOT NULL,
	"response_error_text" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"is_integrated" boolean DEFAULT false NOT NULL,
	"integrated_at" text,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;