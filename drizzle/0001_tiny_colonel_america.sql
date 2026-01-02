CREATE TABLE `postcardImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postcardId` int NOT NULL,
	`s3Key` text NOT NULL,
	`s3Url` text NOT NULL,
	`originalUrl` text,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`width` int,
	`height` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postcardImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postcards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ebayUrl` text NOT NULL,
	`ebayId` varchar(255),
	`title` text NOT NULL,
	`price` varchar(50),
	`seller` varchar(255),
	`description` text,
	`warPeriod` enum('WWI','WWII','Holocaust') NOT NULL,
	`dateFound` timestamp NOT NULL DEFAULT (now()),
	`transcriptionStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `postcards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrapingLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('started','completed','failed') NOT NULL,
	`searchQuery` text,
	`itemsFound` int DEFAULT 0,
	`itemsAdded` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `scrapingLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postcardId` int NOT NULL,
	`imageId` int,
	`transcribedText` text NOT NULL,
	`confidence` varchar(50),
	`language` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `postcardId_idx` ON `postcardImages` (`postcardId`);--> statement-breakpoint
CREATE INDEX `ebayId_idx` ON `postcards` (`ebayId`);--> statement-breakpoint
CREATE INDEX `warPeriod_idx` ON `postcards` (`warPeriod`);--> statement-breakpoint
CREATE INDEX `transcriptionStatus_idx` ON `postcards` (`transcriptionStatus`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `scrapingLogs` (`status`);--> statement-breakpoint
CREATE INDEX `startedAt_idx` ON `scrapingLogs` (`startedAt`);--> statement-breakpoint
CREATE INDEX `postcardId_idx` ON `transcriptions` (`postcardId`);