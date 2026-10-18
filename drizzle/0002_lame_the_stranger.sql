PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`quote_id` text,
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
INSERT INTO `__new_invoices`("id", "number", "client_id", "quote_id", "items", "subtotal_cents", "tax_cents", "total_cents", "tax_rate_bps", "status", "created_at") SELECT "id", "number", "client_id", "quote_id", "items", "subtotal_cents", "tax_cents", "total_cents", "tax_rate_bps", "status", "created_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_quote_id_unique` ON `invoices` (`quote_id`);