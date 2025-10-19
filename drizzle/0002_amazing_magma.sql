ALTER TABLE `analyses` ADD `progress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `cuts` ADD `progress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transcriptions` ADD `progress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `videos` ADD `transcriptionProgress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `videos` ADD `analysisProgress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `videos` ADD `cuttingProgress` int DEFAULT 0;