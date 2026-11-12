CREATE TABLE `notification_seen_outbox` (
	`owner_identity` text NOT NULL,
	`notification_id` text NOT NULL,
	`seen_at` text NOT NULL,
	`wait_reason` text,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` text,
	PRIMARY KEY(`owner_identity`, `notification_id`),
	CONSTRAINT "notification_seen_outbox_wait_reason_check" CHECK("notification_seen_outbox"."wait_reason" is null or "notification_seen_outbox"."wait_reason" in ('no_connection', 'sign_in_needed', 'office_not_ready')),
	CONSTRAINT "notification_seen_outbox_attempt_check" CHECK("notification_seen_outbox"."attempt_count" >= 0)
);
