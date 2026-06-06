CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `categories_to_places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`place_id` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_to_places_unique_idx` ON `categories_to_places` (`category_id`,`place_id`);--> statement-breakpoint
CREATE TABLE `place_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` integer NOT NULL,
	`external_url` text NOT NULL,
	`credit_name` text NOT NULL,
	`credit_url` text,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `place_images_place_idx` ON `place_images` (`place_id`);--> statement-breakpoint
CREATE TABLE `places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`address` text,
	`latitude` real,
	`longitude` real,
	`access_notes` text,
	`best_light` text,
	`best_period` text,
	`accessibility_level` integer DEFAULT 3 NOT NULL,
	`crowd_level` integer DEFAULT 3 NOT NULL,
	`is_public_place` integer DEFAULT true NOT NULL,
	`created_by_clerk_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `places_slug_idx` ON `places` (`slug`);--> statement-breakpoint
CREATE INDEX `places_city_idx` ON `places` (`city`);--> statement-breakpoint
CREATE INDEX `places_created_at_idx` ON `places` (`created_at`);