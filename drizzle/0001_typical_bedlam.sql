CREATE TABLE `damage_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assessor_name` text NOT NULL,
	`phone` text NOT NULL,
	`organization` text,
	`observed_at` text NOT NULL,
	`district` text NOT NULL,
	`village` text NOT NULL,
	`location_details` text NOT NULL,
	`latitude` text,
	`longitude` text,
	`severity` text NOT NULL,
	`access_status` text NOT NULL,
	`water_present` integer DEFAULT false NOT NULL,
	`flood_depth_cm` integer DEFAULT 0 NOT NULL,
	`households_affected` integer DEFAULT 0 NOT NULL,
	`people_affected` integer DEFAULT 0 NOT NULL,
	`people_displaced` integer DEFAULT 0 NOT NULL,
	`people_injured` integer DEFAULT 0 NOT NULL,
	`structures_damaged` integer DEFAULT 0 NOT NULL,
	`structures_destroyed` integer DEFAULT 0 NOT NULL,
	`categories` text NOT NULL,
	`hazards` text NOT NULL,
	`evidence_url` text,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `damage_assessments_reference_unique` ON `damage_assessments` (`reference`);--> statement-breakpoint
CREATE INDEX `damage_assessments_status_created_idx` ON `damage_assessments` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `damage_assessments_district_idx` ON `damage_assessments` (`district`);