ALTER TABLE `tax_returns` ADD COLUMN `amount_owing` DECIMAL(8,2) DEFAULT 0.00;
ALTER TABLE `tax_returns` ADD COLUMN `details` TEXT NULL DEFAULT NULL;
ALTER TABLE `quotes_line_items` ADD COLUMN `enabled` TINYINT(1) UNSIGNED DEFAULT 1;
ALTER TABLE `quotes_line_items` ADD COLUMN `on_original_quote` TINYINT(1) UNSIGNED DEFAULT 1;
ALTER TABLE `checklist_items` ADD COLUMN `admin_only` TINYINT(1) UNSIGNED DEFAULT 0;