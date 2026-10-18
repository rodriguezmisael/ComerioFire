CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`recipient` text NOT NULL,
	`location` text NOT NULL,
	`town` text NOT NULL,
	`valid_from` text NOT NULL,
	`valid_until` text NOT NULL,
	`count` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`inspected_at` text,
	`previous_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_number_unique` ON `certificates` (`number`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`town` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`items` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`tax_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`tax_rate_bps` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_quote_id_unique` ON `invoices` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`items` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`tax_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`tax_rate_bps` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_number_unique` ON `quotes` (`number`);