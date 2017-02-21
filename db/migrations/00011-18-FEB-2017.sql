ALTER TABLE `status` 
ADD COLUMN `paid` INT(1) NULL DEFAULT 0 AFTER `updated_at`;


# update Paid Only, to be efiled, efiled, and signature pending

UPDATE `status`
SET `paid`=1
WHERE `id` IN (8,9,10,12);


CREATE TABLE `status_changes` (
  `initial_status_id` INT(11) NOT NULL,
  `end_status_id` INT(11) NOT NULL,
  `role` VARCHAR(45) NOT NULL,
  `through_api_only` TINYINT NULL DEFAULT 0,
  `name` VARCHAR(255) NULL,
  `display_text` VARCHAR(255) NULL,
  `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`initial_status_id`, `end_status_id`, `role`))

;


#allowed changes

INSERT INTO `status_changes` ( `initial_status_id`,
  `end_status_id`,
  `role`,
  `through_api_only`,
  `name`,
  `display_text`
  )

VALUES 
(2,11,'Customer',0,'New_to_UserCompletedProfile','Move from New to User Completed Personal Profile'),
(11,3,'Customer',0,'UserCompletedProfile_to_DataEntry','User Completed Profile to Data Entry'),

(3,4,'TaxPro',0,'DataEntry_to_PendingInfo','Data Entry to Pending Info'),
(3,4,'Admin',0,'DataEntry_to_PendingInfo','Data Entry to Pending Info'),
(4,3,'TaxPro',0,'PendingInfo_to_DataEntry','Pending Info to Data Entry'),
(4,3,'Admin',0,'PendingInfo_to_DataEntry','Pending Info to Data Entry'),
(3,6,'TaxPro',0,'DataEntry_to_InReview','Data Entry to In Review'),
(3,6,'Admin',0,'DataEntry_to_InReview','Data Entry to In Review'),

(6,5,'Admin',0,'InReview_to_DataEntryComplete','In Review to Data Entry Complete'),
(5,7,'Admin',1,'DataEntryComplete_to_ResultsFormInvoice','Data Entry Complete to Results, Forms, Invoice'),
(7,8,'Customer',1,'ResultsFormInvoice_to_PaidOnly','Results, Forms, Invoice to Paid Only'),
(7,8,'Admin',0,'ResultsFormInvoice_to_PaidOnly','Results, Forms, Invoice to Paid Only'),
(8,12,'Customer',1,'PaidOnly_to_SignaturePending','Paid Only to Signature Pending'),
(8,12,'Taxpro',0,'PaidOnly_to_SignaturePending','Paid Only to Signature Pending'),
(8,12,'Admin',0,'PaidOnly_to_SignaturePending','Paid Only to Signature Pending'),
(12,9,'Taxpro',0,'SignaturePending_to_ToBeEfiled','Paid Only to To Be Efiled by Taxplan'),
(12,9,'Admin',0,'SignaturePending_to_ToBeEfiled','Paid Only to To Be Efiled by Taxplan'),
(9,10,'Taxpro',0,'ToBeEfiled_to_Efiled','To Be Efiled to Efiled with CRA'),
(9,10,'Admin',0,'ToBeEfiled_to_Efiled','To Be Efiled to Efiled with CRA')

;




