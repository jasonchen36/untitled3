UPDATE `questions` SET `sort_order`= 12 WHERE `id`=144;
UPDATE `questions` SET `sort_order`= 13 WHERE `id`=148;
INSERT INTO `questions` (`id`, `category_id`, `sort_order`, `text`, `instructions`, `type`) VALUES (1013, 5, 11, 'Search & Rescue', '', 'Bool');
INSERT INTO `products_questions` (`question_id`, `product_id`) VALUES (1013, 10);

