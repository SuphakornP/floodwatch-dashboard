CREATE TABLE `help_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`urgency` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`alternate_contact` text,
	`preferred_language` text NOT NULL,
	`district` text NOT NULL,
	`village` text NOT NULL,
	`location_details` text NOT NULL,
	`latitude` text,
	`longitude` text,
	`people_count` integer NOT NULL,
	`children_under_five` integer DEFAULT 0 NOT NULL,
	`older_adults` integer DEFAULT 0 NOT NULL,
	`disability_or_mobility_needs` integer DEFAULT false NOT NULL,
	`needs` text NOT NULL,
	`details` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `help_requests_reference_unique` ON `help_requests` (`reference`);--> statement-breakpoint
CREATE INDEX `help_requests_status_created_idx` ON `help_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `help_requests_district_idx` ON `help_requests` (`district`);