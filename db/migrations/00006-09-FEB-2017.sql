ALTER TABLE `taxplan_dev_api`.`tax_returns`
CHANGE COLUMN `amount_owing` `refund` DECIMAL(8,2) NULL DEFAULT '0.00' ;
