ALTER TABLE `field_surveys` ADD `author_role` text DEFAULT 'field_reporter' NOT NULL CONSTRAINT "field_surveys_author_role_check" CHECK (`author_role` in ('field_reporter', 'farmer'));
