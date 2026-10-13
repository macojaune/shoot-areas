CREATE TABLE `communes` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`territory` text NOT NULL,
	`department_code` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `communes_territory_name_idx` ON `communes` (`territory`,`normalized_name`);