CREATE TABLE `sync_download_progresses` (
	`owner_identity` text NOT NULL,
	`feed` text NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`owner_identity`, `feed`)
);
