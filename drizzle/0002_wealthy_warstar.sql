CREATE TABLE `alert_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`status` text NOT NULL,
	`attempted_at` text NOT NULL,
	`response_code` integer,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `alert_deliveries_alert_idx` ON `alert_deliveries` (`alert_id`,`attempted_at`);--> statement-breakpoint
CREATE TABLE `alert_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`district` text NOT NULL,
	`language` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`consented_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alert_subscriptions_endpoint_unique` ON `alert_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `alert_subscriptions_active_district_idx` ON `alert_subscriptions` (`active`,`district`);--> statement-breakpoint
CREATE TABLE `warning_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`severity` text NOT NULL,
	`district` text NOT NULL,
	`title_en` text NOT NULL,
	`title_my` text NOT NULL,
	`title_th` text NOT NULL,
	`body_en` text NOT NULL,
	`body_my` text NOT NULL,
	`body_th` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text,
	`observed_at` text,
	`created_at` text NOT NULL,
	`published_at` text,
	`expires_at` text NOT NULL,
	`created_by` text NOT NULL,
	`trigger_key` text,
	`auto_generated` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warning_alerts_trigger_key_unique` ON `warning_alerts` (`trigger_key`);--> statement-breakpoint
CREATE INDEX `warning_alerts_status_published_idx` ON `warning_alerts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `warning_alerts_district_expires_idx` ON `warning_alerts` (`district`,`expires_at`);