CREATE TABLE `operarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`role` enum('operario','supervisor','warehouse_manager') DEFAULT 'operario',
	`active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `operarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `operarios_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tool_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('individual','common') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tool_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tool_checkouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tool_id` int NOT NULL,
	`operario_id` int NOT NULL,
	`checked_out_at` datetime NOT NULL,
	`checked_in_at` datetime,
	`project` varchar(255),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tool_checkouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('individual','common') NOT NULL,
	`category_id` int,
	`assigned_to` int,
	`location` varchar(255) NOT NULL,
	`status` enum('available','in_use','maintenance','missing') DEFAULT 'available',
	`last_seen` datetime,
	`next_review` datetime,
	`cost` decimal(10,2),
	`serial_number` varchar(255),
	`qr_code` varchar(255),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `tools_qr_code_unique` UNIQUE(`qr_code`)
);
--> statement-breakpoint
ALTER TABLE `tool_checkouts` ADD CONSTRAINT `tool_checkouts_tool_id_tools_id_fk` FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tool_checkouts` ADD CONSTRAINT `tool_checkouts_operario_id_operarios_id_fk` FOREIGN KEY (`operario_id`) REFERENCES `operarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools` ADD CONSTRAINT `tools_category_id_tool_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `tool_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tools` ADD CONSTRAINT `tools_assigned_to_operarios_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `operarios`(`id`) ON DELETE no action ON UPDATE no action;