UPDATE `questions` SET `sort_order`= 13 WHERE `id`=144;
UPDATE `questions` SET `sort_order`= 14 WHERE `id`=148;
INSERT INTO `questions` (`id`, `category_id`, `sort_order`, `text`, `instructions`, `type`, `has_multiple_answers`, `linked_question_id`)
VALUES
	(1014, 5, 12, 'HBP/LLP', 'If you’ve withdrawn money from your RRSP to buy a home or go to school, you may have an obligation to repay this amount.  If so, please select this tile to let your TAXpro know about it.', 'Bool', 0,  NULL);
INSERT INTO `products_questions` (`question_id`, `product_id`)
VALUES
	(1014, 10);