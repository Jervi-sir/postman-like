CREATE TABLE "diagrams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nodes" text NOT NULL,
	"edges" text NOT NULL,
	"viewport" text DEFAULT '{"x":0,"y":0,"zoom":1}' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "is_integrated_frontend" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "integrated_frontend_at" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "is_integrated_mobile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "integrated_mobile_at" text;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "is_integrated";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "integrated_at";