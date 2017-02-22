INSERT INTO `checklist_items` (`id`, `name`, `title`, `subtitle`, `description`, `admin_only`)
VALUES
	(3, 'Documents from TAXplan', NULL, NULL, NULL, 1);

INSERT INTO `checklist_rules` (`id`, `checklist_item_id`, `question_id`, `value`)
VALUES
	(109, 3, 0, 'Yes');

