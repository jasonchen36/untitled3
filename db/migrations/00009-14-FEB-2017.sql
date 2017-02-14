ALTER TABLE `quotes_line_items` 
DROP COLUMN `original_quote`;

ALTER TABLE `quotes_line_items` 
DROP INDEX `UNIQUE_ROW` ,
ADD UNIQUE INDEX `UNIQUE_ROW` (`quote_id` ASC, `tax_return_id` ASC, `text` ASC);

INSERT INTO `direct_deposit_amount` (`product_id`, `amount`) VALUES ('10', '5.00');

CREATE TABLE `admin_quotes_line_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote_id` int(11) NOT NULL,
  `tax_return_id` int(11) NOT NULL,
  `text` varchar(255) DEFAULT NULL,
  `value` decimal(5,2) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ndx_quote_id` (`quote_id`),
  KEY `ndx_tax_return_id` (`tax_return_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2028 DEFAULT CHARSET=utf8;

INSERT INTO `taxplan_dev_api`.`checklist_items` (`name`, `subtitle`, `description`, `admin_only`) VALUES ('Documents to be Signed', 'Documents to be Signed', 'Documents to be Signed for this filer', 1);
INSERT INTO `taxplan_dev_api`.`checklist_items` (`name`, `subtitle`, `description`, `admin_only`) VALUES ('Tax Return document', 'Tax Return document', 'Tax Return document for this filer', 1);