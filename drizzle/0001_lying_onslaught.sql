CREATE TABLE `analyses` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`transcriptionId` varchar(64) NOT NULL,
	`cutsData` text,
	`totalCuts` int DEFAULT 0,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cuts` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`analysisId` varchar(64) NOT NULL,
	`cutNumber` int NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`textPreview` text,
	`outputPath` varchar(255),
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `cuts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`srtContent` text NOT NULL,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`duration` int,
	`status` enum('pending','transcribing','analyzing','ready','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
