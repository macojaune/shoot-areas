CREATE TABLE `contributor_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_user_id` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`social_links` text DEFAULT '[]' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contributor_profiles_clerk_user_idx` ON `contributor_profiles` (`clerk_user_id`);--> statement-breakpoint
CREATE TABLE `place_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` integer NOT NULL,
	`created_by_clerk_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `place_favorites_place_idx` ON `place_favorites` (`place_id`);--> statement-breakpoint
CREATE INDEX `place_favorites_user_idx` ON `place_favorites` (`created_by_clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_favorites_unique_user_idx` ON `place_favorites` (`place_id`,`created_by_clerk_id`);