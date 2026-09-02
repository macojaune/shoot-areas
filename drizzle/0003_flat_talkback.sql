CREATE TABLE `place_review_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`review_id` integer NOT NULL,
	`external_url` text NOT NULL,
	`preview_url` text,
	`credit_name` text NOT NULL,
	`credit_url` text,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `place_reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `place_review_images_review_idx` ON `place_review_images` (`review_id`);--> statement-breakpoint
ALTER TABLE `place_images` ADD `preview_url` text;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `access_notes` text;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `best_light` text;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `best_period` text;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `accessibility_level` integer;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `crowd_level` integer;--> statement-breakpoint
ALTER TABLE `place_reviews` ADD `is_public_place` integer;