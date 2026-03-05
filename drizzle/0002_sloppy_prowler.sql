CREATE TABLE `transcriptionSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postcardId` int NOT NULL,
	`userId` int NOT NULL,
	`suggestedText` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transcriptionSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postcardId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `postcards` ADD `uploadedBy` int;--> statement-breakpoint
CREATE INDEX `postcardId_idx` ON `transcriptionSuggestions` (`postcardId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `transcriptionSuggestions` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `userCollections` (`userId`);--> statement-breakpoint
CREATE INDEX `postcardId_idx` ON `userCollections` (`postcardId`);