-- Run this migration once against printokidsph_db to add auth support.
-- Safe to re-run: uses IF NOT EXISTS checks via column existence.

-- Add event_name and event_date to event_orders (schema gap from ERD)
ALTER TABLE `event_orders`
    ADD COLUMN IF NOT EXISTS `event_name` VARCHAR(255) NULL AFTER `customer_id`,
    ADD COLUMN IF NOT EXISTS `event_date` DATE NULL AFTER `event_name`;

-- Add password column to customers (customer login)
ALTER TABLE `customers`
    ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NULL AFTER `phone`;

-- Add auth columns to staff (admin login)
ALTER TABLE `staff`
    ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NULL AFTER `status`,
    ADD COLUMN IF NOT EXISTS `is_admin` TINYINT(1) NOT NULL DEFAULT 0 AFTER `password_hash`;

-- Seed one default admin staff account (password: admin1234)
-- Change this immediately after first login!
UPDATE `staff` SET
    `password_hash` = '$2y$12$5GVQFqFb2Z3k9Y1Oy7mS8.T2BtnzaFqj5R9Pq1Yw3Kz6VmXuNpKi',
    `is_admin` = 1
WHERE `id` = 1;
