-- Migration: Add password column to customers table for authentication
-- This script adds password support for customer login functionality

ALTER TABLE `customers` 
ADD COLUMN `password` varchar(255) NULL AFTER `phone`;

-- Make email column NOT NULL and add unique constraint if not already present
-- (This ensures each customer has a unique email for login)
ALTER TABLE `customers` 
MODIFY COLUMN `email` varchar(150) NOT NULL,
ADD UNIQUE KEY `unique_email` (`email`);

-- Optional: Add created_at and updated_at timestamps for tracking
ALTER TABLE `customers` 
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Display the updated table structure
DESCRIBE `customers`;
