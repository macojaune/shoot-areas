CREATE TABLE `place_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` integer NOT NULL,
	`created_by_clerk_id` text NOT NULL,
	`rating` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `place_reviews_place_idx` ON `place_reviews` (`place_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `place_reviews_unique_user_idx` ON `place_reviews` (`place_id`,`created_by_clerk_id`);