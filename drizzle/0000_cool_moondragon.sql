CREATE TABLE `postcardImages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postcardId` integer NOT NULL,
	`s3Key` text NOT NULL,
	`s3Url` text NOT NULL,
	`originalUrl` text,
	`isPrimary` integer DEFAULT false NOT NULL,
	`width` integer,
	`height` integer,
	`createdAt` integer
);
--> statement-breakpoint
CREATE TABLE `postcards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ebayUrl` text NOT NULL,
	`ebayId` text,
	`title` text NOT NULL,
	`price` text,
	`seller` text,
	`description` text,
	`warPeriod` text NOT NULL,
	`dateFound` integer,
	`transcriptionStatus` text DEFAULT 'pending' NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	`uploadedBy` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `scrapingLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text NOT NULL,
	`searchQuery` text,
	`itemsFound` integer DEFAULT 0,
	`itemsAdded` integer DEFAULT 0,
	`errorMessage` text,
	`startedAt` integer,
	`completedAt` integer
);
--> statement-breakpoint
CREATE TABLE `transcriptionSuggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postcardId` integer NOT NULL,
	`userId` integer NOT NULL,
	`suggestedText` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postcardId` integer NOT NULL,
	`imageId` integer,
	`transcribedText` text NOT NULL,
	`confidence` text,
	`language` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `userCollections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postcardId` integer NOT NULL,
	`createdAt` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	`lastSignedIn` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);