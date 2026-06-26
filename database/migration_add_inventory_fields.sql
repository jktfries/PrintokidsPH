ALTER TABLE `products`
ADD COLUMN `stock_count` INT NOT NULL DEFAULT 0 AFTER `base_cost`,
ADD COLUMN `reorder_level` INT NOT NULL DEFAULT 10 AFTER `stock_count`,
ADD COLUMN `stock_status` VARCHAR(50) NOT NULL DEFAULT 'In Stock' AFTER `reorder_level`;

UPDATE `products`
SET 
  `stock_count` = FLOOR(20 + RAND() * 181),
  `reorder_level` = 15;

UPDATE `products`
SET `stock_status` = CASE
  WHEN `stock_count` <= 0 THEN 'Out of Stock'
  WHEN `stock_count` <= `reorder_level` THEN 'Low Stock'
  ELSE 'In Stock'
END;
