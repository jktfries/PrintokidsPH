-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 28, 2026 at 04:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `printokidsph_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL,
  `asset_name` varchar(100) NOT NULL,
  `asset_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `asset_name`, `asset_type`) VALUES
(1, 'Heat Press A', 'Machinery'),
(2, 'Epson Printer', 'Printer');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`) VALUES
(2, 'David', 'Cruz', 'david.cruz2@example.com', '09954874906', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(3, 'Chris', 'Mendoza', 'chris.mendoza3@example.com', '09336697535', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(4, 'Chris', 'Cruz', 'chris.cruz4@example.com', '09496031707', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(5, 'Bea', 'Garcia', 'bea.garcia5@example.com', '09217480229', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(6, 'David', 'Mendoza', 'david.mendoza6@example.com', '09877139651', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(7, 'John', 'Flores', 'john.flores7@example.com', '09356269277', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(8, 'Bea', 'Reyes', 'bea.reyes8@example.com', '09753785709', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(9, 'Sarah', 'Mendoza', 'sarah.mendoza9@example.com', '09740159939', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(10, 'Sarah', 'Torres', 'sarah.torres10@example.com', '09774349635', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(11, 'Josh', 'Villanueva', 'josh.villanueva11@example.com', '09126604018', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(12, 'David', 'Villanueva', 'david.villanueva12@example.com', '09315757781', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(13, 'Mia', 'Santos', 'mia.santos13@example.com', '09909812989', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(14, 'Bea', 'Bautista', 'bea.bautista14@example.com', '09525348715', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(15, 'Chloe', 'Santos', 'chloe.santos15@example.com', '09900075473', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(16, 'Michael', 'Cruz', 'michael.cruz16@example.com', '09671361171', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(17, 'John', 'Mendoza', 'john.mendoza17@example.com', '09158726541', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(18, 'Mia', 'Garcia', 'mia.garcia18@example.com', '09484153921', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(19, 'Chloe', 'Cruz', 'chloe.cruz19@example.com', '09177407938', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(20, 'Josh', 'Smith', 'josh.smith20@example.com', '09739221332', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(21, 'Chris', 'Villanueva', 'chris.villanueva21@example.com', '09458259307', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(22, 'Bea', 'Reyes', 'bea.reyes22@example.com', '09967073531', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(23, 'John', 'Flores', 'john.flores23@example.com', '09493794527', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(24, 'Jane', 'Torres', 'jane.torres24@example.com', '09255548395', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(25, 'Mark', 'Garcia', 'mark.garcia25@example.com', '09990758806', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(26, 'Jane', 'Torres', 'jane.torres26@example.com', '09534470408', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(27, 'Bea', 'Reyes', 'bea.reyes27@example.com', '09138991198', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(28, 'Jane', 'Reyes', 'jane.reyes28@example.com', '09910187442', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(29, 'Emma', 'Reyes', 'emma.reyes29@example.com', '09170724752', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(30, 'John', 'Santos', 'john.santos30@example.com', '09546610885', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(31, 'Jane', 'Flores', 'jane.flores31@example.com', '09807515206', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(32, 'Sarah', 'Smith', 'sarah.smith32@example.com', '09704173855', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(33, 'Chloe', 'Cruz', 'chloe.cruz33@example.com', '09838579283', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(34, 'David', 'Villanueva', 'david.villanueva34@example.com', '09430962673', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(35, 'Mark', 'Mendoza', 'mark.mendoza35@example.com', '09397564136', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(36, 'Chloe', 'Flores', 'chloe.flores36@example.com', '09930632589', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(37, 'Emma', 'Villanueva', 'emma.villanueva37@example.com', '09686278283', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(38, 'Bea', 'Bautista', 'bea.bautista38@example.com', '09884846443', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(39, 'Michael', 'Bautista', 'michael.bautista39@example.com', '09181315591', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(40, 'Emma', 'Santos', 'emma.santos40@example.com', '09756223373', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(41, 'Chloe', 'Torres', 'chloe.torres41@example.com', '09736910291', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(42, 'Bea', 'Santos', 'bea.santos42@example.com', '09944391919', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(43, 'David', 'Garcia', 'david.garcia43@example.com', '09708836862', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(44, 'Josh', 'Villanueva', 'josh.villanueva44@example.com', '09282219757', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(45, 'David', 'Cruz', 'david.cruz45@example.com', '09283681208', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(46, 'Mark', 'Villanueva', 'mark.villanueva46@example.com', '09654290099', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(47, 'John', 'Santos', 'john.santos47@example.com', '09445694324', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(48, 'Bea', 'Reyes', 'bea.reyes48@example.com', '09144913576', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(49, 'Mark', 'Cruz', 'mark.cruz49@example.com', '09793660646', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(50, 'Bea', 'Flores', 'bea.flores50@example.com', '09427710355', NULL, NULL, NULL, '2026-06-27 05:19:00', '2026-06-27 05:19:00'),
(51, 'Joco', 'Caballero', 'joculet05@gmail.com', '09165130301', '$2y$10$OxlyV/gWucGnFfVONl7MO.9c/qPS9NS7SFW8uEzRW7Bn2qn1yIXNa', NULL, NULL, '2026-06-28 04:42:47', '2026-06-28 04:42:47');

-- --------------------------------------------------------

--
-- Table structure for table `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `address_label` varchar(50) DEFAULT NULL,
  `street_address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `address_label`, `street_address`, `city`, `province`, `postal_code`, `is_default`) VALUES
(2, 2, 'Home', 'Block 2 Lot 2 Main St', 'Manila', 'Metro Manila', '1000', 1),
(3, 3, 'Home', 'Block 3 Lot 3 Main St', 'Alabang', 'Metro Manila', '1000', 1),
(4, 4, 'Home', 'Block 4 Lot 4 Main St', 'Makati', 'Metro Manila', '1000', 1),
(5, 5, 'Home', 'Block 5 Lot 5 Main St', 'Alabang', 'Metro Manila', '1000', 1),
(6, 6, 'Home', 'Block 6 Lot 6 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(7, 7, 'Home', 'Block 7 Lot 7 Main St', 'Makati', 'Metro Manila', '1000', 1),
(8, 8, 'Home', 'Block 8 Lot 8 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(9, 9, 'Home', 'Block 9 Lot 9 Main St', 'Manila', 'Metro Manila', '1000', 1),
(10, 10, 'Home', 'Block 10 Lot 10 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(11, 11, 'Home', 'Block 11 Lot 11 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(12, 12, 'Home', 'Block 12 Lot 12 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(13, 13, 'Home', 'Block 13 Lot 13 Main St', 'Manila', 'Metro Manila', '1000', 1),
(14, 14, 'Home', 'Block 14 Lot 14 Main St', 'Alabang', 'Metro Manila', '1000', 1),
(15, 15, 'Home', 'Block 15 Lot 15 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(16, 16, 'Home', 'Block 16 Lot 16 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(17, 17, 'Home', 'Block 17 Lot 17 Main St', 'Quezon City', 'Metro Manila', '1000', 1),
(18, 18, 'Home', 'Block 18 Lot 18 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(19, 19, 'Home', 'Block 19 Lot 19 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(20, 20, 'Home', 'Block 20 Lot 20 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(21, 21, 'Home', 'Block 21 Lot 21 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(22, 22, 'Home', 'Block 22 Lot 22 Main St', 'Manila', 'Metro Manila', '1000', 1),
(23, 23, 'Home', 'Block 23 Lot 23 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(24, 24, 'Home', 'Block 24 Lot 24 Main St', 'Manila', 'Metro Manila', '1000', 1),
(25, 25, 'Home', 'Block 25 Lot 25 Main St', 'Quezon City', 'Metro Manila', '1000', 1),
(26, 26, 'Home', 'Block 26 Lot 26 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(27, 27, 'Home', 'Block 27 Lot 27 Main St', 'Manila', 'Metro Manila', '1000', 1),
(28, 28, 'Home', 'Block 28 Lot 28 Main St', 'Alabang', 'Metro Manila', '1000', 1),
(29, 29, 'Home', 'Block 29 Lot 29 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(30, 30, 'Home', 'Block 30 Lot 30 Main St', 'Makati', 'Metro Manila', '1000', 1),
(31, 31, 'Home', 'Block 31 Lot 31 Main St', 'Manila', 'Metro Manila', '1000', 1),
(32, 32, 'Home', 'Block 32 Lot 32 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(33, 33, 'Home', 'Block 33 Lot 33 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(34, 34, 'Home', 'Block 34 Lot 34 Main St', 'Manila', 'Metro Manila', '1000', 1),
(35, 35, 'Home', 'Block 35 Lot 35 Main St', 'Quezon City', 'Metro Manila', '1000', 1),
(36, 36, 'Home', 'Block 36 Lot 36 Main St', 'Quezon City', 'Metro Manila', '1000', 1),
(37, 37, 'Home', 'Block 37 Lot 37 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(38, 38, 'Home', 'Block 38 Lot 38 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(39, 39, 'Home', 'Block 39 Lot 39 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(40, 40, 'Home', 'Block 40 Lot 40 Main St', 'Alabang', 'Metro Manila', '1000', 1),
(41, 41, 'Home', 'Block 41 Lot 41 Main St', 'Pasig', 'Metro Manila', '1000', 1),
(42, 42, 'Home', 'Block 42 Lot 42 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(43, 43, 'Home', 'Block 43 Lot 43 Main St', 'Mandaluyong', 'Metro Manila', '1000', 1),
(44, 44, 'Home', 'Block 44 Lot 44 Main St', 'Quezon City', 'Metro Manila', '1000', 1),
(45, 45, 'Home', 'Block 45 Lot 45 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(46, 46, 'Home', 'Block 46 Lot 46 Main St', 'Makati', 'Metro Manila', '1000', 1),
(47, 47, 'Home', 'Block 47 Lot 47 Main St', 'Manila', 'Metro Manila', '1000', 1),
(48, 48, 'Home', 'Block 48 Lot 48 Main St', 'Makati', 'Metro Manila', '1000', 1),
(49, 49, 'Home', 'Block 49 Lot 49 Main St', 'Taguig', 'Metro Manila', '1000', 1),
(50, 50, 'Home', 'Block 50 Lot 50 Main St', 'Manila', 'Metro Manila', '1000', 1),
(51, 51, 'Home', 'Park Terraces, Ayala Paseo', 'Makati', 'Metro Manila', '1125', 1);

-- --------------------------------------------------------

--
-- Table structure for table `event_orders`
--

CREATE TABLE `event_orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `event_name` varchar(255) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `order_date` datetime DEFAULT current_timestamp(),
  `event_location` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `admin_notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_orders`
--

INSERT INTO `event_orders` (`id`, `customer_id`, `event_name`, `event_date`, `event_type`, `order_date`, `event_location`, `status`, `admin_notes`, `cancellation_reason`) VALUES
(10, 23, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(11, 36, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Quezon City Convention Center', 'Confirmed', NULL, NULL),
(12, 29, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Taguig Convention Center', 'Confirmed', NULL, NULL),
(13, 48, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Quezon City Convention Center', 'Confirmed', NULL, NULL),
(14, 34, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(15, 24, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Manila Convention Center', 'Pending', NULL, NULL),
(16, 46, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(17, 50, NULL, NULL, NULL, '2026-06-18 23:51:36', 'Taguig Convention Center', 'Confirmed', NULL, NULL),
(18, 32, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(19, 23, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Mandaluyong Convention Center', 'Confirmed', NULL, NULL),
(20, 20, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Taguig Convention Center', 'Confirmed', NULL, NULL),
(21, 27, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Pending', NULL, NULL),
(22, 4, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(23, 38, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Quezon City Convention Center', 'Confirmed', NULL, NULL),
(24, 6, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Manila Convention Center', 'Confirmed', NULL, NULL),
(25, 25, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Confirmed', NULL, NULL),
(26, 33, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Mandaluyong Convention Center', 'Confirmed', NULL, NULL),
(27, 40, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Pending', NULL, NULL),
(28, 42, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Mandaluyong Convention Center', 'Confirmed', NULL, NULL),
(29, 9, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Alabang Convention Center', 'Confirmed', NULL, NULL),
(30, 33, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Quezon City Convention Center', 'Confirmed', NULL, NULL),
(31, 25, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Manila Convention Center', 'Confirmed', NULL, NULL),
(32, 27, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Alabang Convention Center', 'Confirmed', NULL, NULL),
(33, 28, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Alabang Convention Center', 'Pending', NULL, NULL),
(34, 26, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Confirmed', NULL, NULL),
(35, 19, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Confirmed', NULL, NULL),
(36, 32, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Confirmed', NULL, NULL),
(37, 27, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Taguig Convention Center', 'Confirmed', NULL, NULL),
(38, 32, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(39, 43, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Manila Convention Center', 'Pending', NULL, NULL),
(40, 22, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Quezon City Convention Center', 'Confirmed', NULL, NULL),
(41, 42, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Manila Convention Center', 'Confirmed', NULL, NULL),
(42, 4, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Makati Convention Center', 'Pending', NULL, NULL),
(43, 50, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(44, 31, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Mandaluyong Convention Center', 'Confirmed', NULL, NULL),
(45, 41, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Alabang Convention Center', 'Pending', NULL, NULL),
(46, 8, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Taguig Convention Center', 'Confirmed', NULL, NULL),
(47, 23, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Pasig Convention Center', 'Confirmed', NULL, NULL),
(48, 39, NULL, NULL, NULL, '2026-06-18 23:51:37', 'Quezon City Convention Center', 'Pending', NULL, NULL),
(51, 51, 'Joco 99th Bday bash', '2026-06-28', 'Birthday', '2026-06-28 12:45:51', 'Makati City Hall', 'Pending', NULL, NULL),
(52, 51, 'Joco\'s 100th bday bash go home gramps', '2026-06-29', 'Birthday', '2026-06-28 17:08:50', 'Ayala Triangle', 'Confirmed', 'Hello we have received your message thank you. we\'ll update you throughout the process and we will reach out to you', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `event_staff_assignments`
--

CREATE TABLE `event_staff_assignments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_staff_assignments`
--

INSERT INTO `event_staff_assignments` (`id`, `order_id`, `staff_id`, `role_id`) VALUES
(19, 10, 1, 1),
(20, 10, 29, 2),
(21, 11, 15, 1),
(22, 11, 39, 2),
(23, 12, 12, 1),
(24, 12, 41, 2),
(25, 13, 20, 1),
(26, 13, 42, 2),
(27, 14, 3, 1),
(28, 14, 43, 2),
(29, 15, 10, 1),
(30, 15, 37, 2),
(31, 16, 25, 1),
(32, 16, 45, 2),
(33, 17, 11, 1),
(34, 17, 44, 2),
(35, 18, 5, 1),
(36, 18, 36, 2),
(37, 19, 25, 1),
(38, 19, 36, 2),
(39, 20, 23, 1),
(40, 20, 28, 2),
(41, 21, 5, 1),
(42, 21, 49, 2),
(43, 22, 10, 1),
(44, 22, 29, 2),
(45, 23, 16, 1),
(46, 23, 35, 2),
(47, 24, 19, 1),
(48, 24, 34, 2),
(49, 25, 8, 1),
(50, 25, 48, 2),
(51, 26, 6, 1),
(52, 26, 34, 2),
(53, 27, 5, 1),
(54, 27, 45, 2),
(55, 28, 9, 1),
(56, 28, 26, 2),
(57, 29, 5, 1),
(58, 29, 45, 2),
(59, 30, 5, 1),
(60, 30, 36, 2),
(61, 31, 13, 1),
(62, 31, 33, 2),
(63, 32, 20, 1),
(64, 32, 42, 2),
(65, 33, 8, 1),
(66, 33, 37, 2),
(67, 34, 14, 1),
(68, 34, 32, 2),
(69, 35, 17, 1),
(70, 35, 44, 2),
(71, 36, 18, 1),
(72, 36, 40, 2),
(73, 37, 3, 1),
(74, 37, 32, 2),
(75, 38, 23, 1),
(76, 38, 34, 2),
(77, 39, 12, 1),
(78, 39, 47, 2),
(79, 40, 5, 1),
(80, 40, 32, 2),
(81, 41, 6, 1),
(82, 41, 26, 2),
(83, 42, 21, 1),
(84, 42, 46, 2),
(85, 43, 3, 1),
(86, 43, 39, 2),
(87, 44, 2, 1),
(88, 44, 27, 2),
(89, 45, 17, 1),
(90, 45, 50, 2),
(91, 46, 14, 1),
(92, 46, 39, 2),
(93, 47, 20, 1),
(94, 47, 26, 2),
(95, 48, 2, 1),
(96, 48, 35, 2);

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','unsubscribed') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_services`
--

CREATE TABLE `order_services` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `price_charged` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_services`
--

INSERT INTO `order_services` (`id`, `order_id`, `service_id`, `asset_id`, `start_time`, `end_time`, `price_charged`) VALUES
(10, 10, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(11, 11, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(12, 12, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(13, 13, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(14, 14, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(15, 15, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(16, 16, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(17, 17, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(18, 18, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(19, 19, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(20, 20, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(21, 21, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(22, 22, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(23, 23, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(24, 24, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(25, 25, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(26, 26, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(27, 27, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(28, 28, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(29, 29, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(30, 30, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(31, 31, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(32, 32, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(33, 33, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(34, 34, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(35, 35, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(36, 36, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(37, 37, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(38, 38, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(39, 39, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(40, 40, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(41, 41, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(42, 42, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(43, 43, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(44, 44, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(45, 45, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(46, 46, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(47, 47, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00),
(48, 48, 1, 1, '2026-08-01 08:00:00', '2026-08-01 17:00:00', 8000.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `base_cost` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `stock_count` int(11) NOT NULL DEFAULT 0,
  `reorder_level` int(11) NOT NULL DEFAULT 10,
  `stock_status` varchar(50) NOT NULL DEFAULT 'In Stock',
  `force_out_of_stock` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category`, `base_cost`, `description`, `is_active`, `stock_count`, `reorder_level`, `stock_status`, `force_out_of_stock`, `created_at`) VALUES
(1, 'Premium Tumbler', 'General', 953.00, 'High-quality tumbler with customizable print design.', 0, 85, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(2, 'Classic Tote Bag', 'General', 1362.00, 'Durable tote bag perfect for personalized event giveaways.', 0, 120, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(3, 'Basic Jacket', 'General', 608.00, 'Comfortable jacket with heat-press customization.', 0, 44, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(4, 'Classic Jacket', 'General', 1392.00, 'Premium jacket with high-quality personalized printing.', 0, 29, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(5, 'Eco-friendly Tote Bag', 'General', 877.00, 'Sustainable tote bag made from eco-friendly materials.', 0, 95, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(6, 'Pro Cap', 'General', 1311.00, 'Professional-grade cap with embroidered or printed design.', 0, 60, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(7, 'Pro T-Shirt', 'General', 823.00, 'High-quality t-shirt with full-color custom print.', 0, 110, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(8, 'Basic Cap', 'General', 1457.00, 'Simple cap with your custom logo or text.', 0, 75, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(9, 'Premium Cap', 'General', 171.00, 'Top-tier cap with premium finish and print.', 0, 200, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(10, 'Eco-friendly Tumbler', 'General', 538.00, 'Eco-conscious tumbler with personalized design.', 0, 150, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(11, 'Classic Cap', 'General', 111.00, 'Everyday cap with clean custom branding.', 0, 180, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(12, 'Premium Tote Bag', 'General', 166.00, 'Deluxe tote with high-resolution custom artwork.', 0, 90, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(13, 'Classic Tote Bag', 'General', 724.00, 'Versatile tote bag for events and daily use.', 0, 55, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(14, 'Custom Mug', 'General', 850.00, 'Ceramic mug with full-wrap personalized design.', 1, 100, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(15, 'Classic Lanyard', 'General', 431.00, 'Standard lanyard with custom print for events.', 1, 130, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(16, 'Classic Mug', 'General', 493.00, 'Everyday mug with your chosen design or text.', 1, 70, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(17, 'Basic Tote Bag', 'General', 943.00, 'Affordable tote for bulk event giveaways.', 1, 65, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(18, 'Custom T-Shirt', 'General', 1048.00, 'Fully customizable t-shirt with your own artwork.', 1, 80, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(19, 'Basic T-Shirt', 'General', 384.00, 'Budget-friendly t-shirt with simple custom print.', 1, 139, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(20, 'Classic Cap', 'General', 598.00, 'Reliable cap with durable custom printing.', 1, 50, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(21, 'Custom Lanyard', 'General', 1212.00, 'Personalized lanyard with your logo and colors.', 1, 40, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(22, 'Premium Mug', 'General', 974.00, 'High-end mug with vivid color printing.', 1, 90, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(23, 'Pro Lanyard', 'General', 1325.00, 'Professional lanyard with premium materials.', 1, 35, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(24, 'Pro Tumbler', 'General', 457.00, 'Professional-grade tumbler with custom branding.', 1, 110, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(25, 'Eco-friendly Lanyard', 'General', 281.00, 'Sustainable lanyard with eco-conscious materials.', 1, 160, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(26, 'Basic Mug', 'General', 240.00, 'Simple ceramic mug with basic custom print.', 1, 100, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(27, 'Basic Mug', 'General', 321.00, 'Affordable mug for bulk orders and giveaways.', 1, 95, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(28, 'Basic Cap', 'General', 344.00, 'Lightweight cap with simple personalization.', 1, 119, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(29, 'Classic Jacket', 'General', 150.00, 'Comfortable jacket for casual custom wear.', 1, 70, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(30, 'Classic Lanyard', 'General', 153.00, 'Standard event lanyard with printed design.', 1, 145, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(31, 'Eco-friendly Mug', 'General', 885.00, 'Sustainable mug with eco-friendly printing.', 1, 55, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(32, 'Classic T-Shirt', 'General', 383.00, 'Comfortable t-shirt with classic custom print.', 1, 130, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(33, 'Basic Tumbler', 'General', 339.00, 'Entry-level tumbler with custom design.', 1, 85, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(34, 'Premium Lanyard', 'General', 1351.00, 'Luxury lanyard with high-quality finishing.', 1, 25, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(35, 'Premium Mug', 'General', 1426.00, 'Top-quality mug with detailed custom artwork.', 1, 45, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(36, 'Custom Lanyard', 'General', 738.00, 'Fully personalized lanyard for corporate events.', 1, 60, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(37, 'Eco-friendly Lanyard', 'General', 948.00, 'Green lanyard with sustainable printing.', 1, 75, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(38, 'Premium Mug', 'General', 963.00, 'Premium ceramic with vibrant custom design.', 1, 50, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(39, 'Eco-friendly Cap', 'General', 1035.00, 'Sustainable cap with eco-conscious production.', 1, 40, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(40, 'Premium Lanyard', 'General', 1260.00, 'Deluxe lanyard with premium print quality.', 1, 30, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(41, 'Classic Jacket', 'General', 1429.00, 'Premium classic jacket with custom embroidery.', 1, 20, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(42, 'Premium Tumbler', 'General', 1227.00, 'High-end tumbler with detailed personalization.', 1, 35, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(43, 'Pro Lanyard', 'General', 1492.00, 'Top-tier professional lanyard.', 1, 28, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(44, 'Classic Tote Bag', 'General', 737.00, 'All-purpose tote with clean custom print.', 1, 90, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(45, 'Basic Lanyard', 'General', 1490.00, 'Simple lanyard for basic custom branding.', 1, 22, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(46, 'Custom Jacket', 'General', 892.00, 'Fully customizable jacket with your design.', 1, 54, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(47, 'Premium Tumbler', 'General', 799.00, 'Quality tumbler with precision printing.', 1, 65, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(48, 'Eco-friendly Cap', 'General', 1229.00, 'Eco cap with sustainable custom print.', 1, 40, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(49, 'Custom T-Shirt', 'General', 490.00, 'Affordable custom t-shirt for events.', 1, 100, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(50, 'Pro Tumbler', 'General', 817.00, 'Professional tumbler with premium finish.', 1, 70, 15, 'In Stock', 0, '2026-06-27 05:19:00'),
(51, 'Twinkle Headband', 'General', 456.00, 'test product cause me insane', 1, 4, 10, 'Low Stock', 0, '2026-06-28 10:30:58');

-- --------------------------------------------------------

--
-- Table structure for table `products_attributes`
--

CREATE TABLE `products_attributes` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `attribute_name` varchar(50) NOT NULL,
  `attribute_value` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products_attributes`
--

INSERT INTO `products_attributes` (`id`, `product_id`, `attribute_name`, `attribute_value`) VALUES
(1, 1, 'Size', 'Standard'),
(2, 2, 'Size', 'Standard'),
(3, 3, 'Size', 'Standard'),
(4, 4, 'Size', 'Standard'),
(5, 5, 'Size', 'Standard'),
(6, 6, 'Size', 'Standard'),
(7, 7, 'Size', 'Standard'),
(8, 8, 'Size', 'Standard'),
(9, 9, 'Size', 'Standard'),
(10, 10, 'Size', 'Standard'),
(11, 11, 'Size', 'Standard'),
(12, 12, 'Size', 'Standard'),
(13, 13, 'Size', 'Standard'),
(14, 14, 'Size', 'Standard'),
(15, 15, 'Size', 'Standard'),
(16, 16, 'Size', 'Standard'),
(17, 17, 'Size', 'Standard'),
(18, 18, 'Size', 'Standard'),
(19, 19, 'Size', 'Standard'),
(20, 20, 'Size', 'Standard'),
(21, 21, 'Size', 'Standard'),
(22, 22, 'Size', 'Standard'),
(23, 23, 'Size', 'Standard'),
(24, 24, 'Size', 'Standard'),
(25, 25, 'Size', 'Standard'),
(26, 26, 'Size', 'Standard'),
(27, 27, 'Size', 'Standard'),
(28, 28, 'Size', 'Standard'),
(29, 29, 'Size', 'Standard'),
(30, 30, 'Size', 'Standard'),
(31, 31, 'Size', 'Standard'),
(32, 32, 'Size', 'Standard'),
(33, 33, 'Size', 'Standard'),
(34, 34, 'Size', 'Standard'),
(35, 35, 'Size', 'Standard'),
(36, 36, 'Size', 'Standard'),
(37, 37, 'Size', 'Standard'),
(38, 38, 'Size', 'Standard'),
(39, 39, 'Size', 'Standard'),
(40, 40, 'Size', 'Standard'),
(41, 41, 'Size', 'Standard'),
(42, 42, 'Size', 'Standard'),
(43, 43, 'Size', 'Standard'),
(44, 44, 'Size', 'Standard'),
(45, 45, 'Size', 'Standard'),
(46, 46, 'Size', 'Standard'),
(47, 47, 'Size', 'Standard'),
(48, 48, 'Size', 'Standard'),
(49, 49, 'Size', 'Standard'),
(50, 50, 'Size', 'Standard');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `media_type` varchar(10) NOT NULL DEFAULT 'image',
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `media_type`, `is_primary`, `sort_order`) VALUES
(4, 51, 'http://localhost/PrintokidsPH/uploads/media_6a412f5eb760b5.97069474.jpg', 'image', 1, 0),
(5, 51, 'http://localhost/PrintokidsPH/uploads/media_6a412f65ba59c8.65434974.jpg', 'image', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `product_orders`
--

CREATE TABLE `product_orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `shipping_address_id` int(11) DEFAULT NULL,
  `order_date` datetime DEFAULT current_timestamp(),
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(30) NOT NULL DEFAULT 'Cash on Delivery',
  `payment_status` varchar(20) NOT NULL DEFAULT 'Unpaid',
  `proof_of_payment_url` varchar(255) DEFAULT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tracking_number` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_orders`
--

INSERT INTO `product_orders` (`id`, `customer_id`, `employee_id`, `shipping_address_id`, `order_date`, `status`, `total_amount`, `payment_method`, `payment_status`, `proof_of_payment_url`, `shipping_fee`, `tracking_number`) VALUES
(1, 51, 17, NULL, '2026-06-28 12:44:57', 'In Production', 1392.00, 'Cash on Delivery', 'Unpaid', NULL, 0.00, '102929-92293934954-000'),
(2, 51, NULL, 51, '2026-06-28 17:07:43', 'Confirmed', 344.00, 'QR Pay', 'Verified', 'http://localhost/PrintokidsPH/uploads/media_6a40e45c97e912.54825453.jpg', 80.00, NULL),
(3, 51, NULL, 51, '2026-06-28 17:34:01', 'Pending', 892.00, 'QR Pay', 'Verified', 'http://localhost/PrintokidsPH/uploads/media_6a40ea824d6c31.56339600.jpg', 80.00, NULL),
(4, 51, NULL, 51, '2026-06-28 17:36:17', 'Pending', 608.00, 'Cash on Delivery', 'Unpaid', NULL, 80.00, NULL),
(5, 51, 47, 51, '2026-06-28 17:39:30', 'In Production', 384.00, 'QR Pay', 'Verified', 'http://localhost/PrintokidsPH/uploads/media_6a40ebcf414bc7.19591056.jpg', 80.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_order_items`
--

CREATE TABLE `product_order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `customization_notes` text DEFAULT NULL,
  `media_upload_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_order_items`
--

INSERT INTO `product_order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `customization_notes`, `media_upload_url`) VALUES
(1, 1, 4, 1, 1392.00, 1392.00, 'i love joco', 'http://localhost/PrintokidsPH/uploads/media_6a40a6a0b4b6a5.29597877.jpg'),
(2, 2, 28, 1, 344.00, 344.00, NULL, NULL),
(3, 3, 46, 1, 892.00, 892.00, NULL, NULL),
(4, 4, 3, 1, 608.00, 608.00, NULL, NULL),
(5, 5, 19, 1, 384.00, 384.00, 'Please make the image as the print with big text infront: GO HOME DAWG', 'http://localhost/PrintokidsPH/uploads/media_6a40eba7680f37.62043336.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `standard_rate` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `title`, `standard_rate`) VALUES
(1, 'Event Coordinator', 1000.00),
(2, 'Booth Operator', 600.00),
(3, 'Graphic Artist', 800.00);

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `service_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `service_name`, `description`) VALUES
(1, 'Pick and Press Booth', 'Live printing'),
(2, 'Bulk Delivery', 'Pre-printed');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `status` enum('Active','On Leave','Terminated') DEFAULT 'Active',
  `password_hash` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `first_name`, `last_name`, `contact_number`, `status`, `password_hash`, `is_admin`) VALUES
(1, 'John', 'Bautista', '09443881739', 'Active', '$2y$12$s57nmmSHX5clvyZnuynV8uKuttMuj0lXFCudOFcEzBGYSJDHM7GYy', 1),
(2, 'John', 'Reyes', '09740760606', 'Active', NULL, 0),
(3, 'Mark', 'Mendoza', '09930324760', 'Active', NULL, 0),
(4, 'Michael', 'Reyes', '09311953270', 'Active', NULL, 0),
(5, 'Chloe', 'Garcia', '09402737663', 'On Leave', NULL, 0),
(6, 'Mia', 'Reyes', '09740166860', 'Active', NULL, 0),
(7, 'Mark', 'Villanueva', '09421028154', 'Active', NULL, 0),
(8, 'John', 'Bautista', '09402843142', 'Active', NULL, 0),
(9, 'Chris', 'Garcia', '09606057928', 'Active', NULL, 0),
(10, 'David', 'Santos', '09141954642', 'On Leave', NULL, 0),
(11, 'Emma', 'Villanueva', '09761088115', 'Active', NULL, 0),
(12, 'David', 'Cruz', '09118204912', 'Active', NULL, 0),
(13, 'Mark', 'Torres', '09619213573', 'Active', NULL, 0),
(14, 'Josh', 'Bautista', '09731842754', 'Active', NULL, 0),
(15, 'Chris', 'Reyes', '09380608244', 'On Leave', NULL, 0),
(16, 'Michael', 'Cruz', '09905391745', 'Active', NULL, 0),
(17, 'Michael', 'Torres', '09731458643', 'Active', NULL, 0),
(18, 'Mark', 'Mendoza', '09439354874', 'Active', NULL, 0),
(19, 'Josh', 'Garcia', '09128811676', 'Active', NULL, 0),
(20, 'Mark', 'Mendoza', '09547260803', 'On Leave', NULL, 0),
(21, 'Sarah', 'Bautista', '09363035668', 'Active', NULL, 0),
(22, 'Bea', 'Reyes', '09267081561', 'Active', NULL, 0),
(23, 'Chloe', 'Mendoza', '09164501114', 'Active', NULL, 0),
(24, 'Chloe', 'Torres', '09352614694', 'Active', NULL, 0),
(25, 'David', 'Garcia', '09161690200', 'On Leave', NULL, 0),
(26, 'Michael', 'Garcia', '09458244579', 'Active', NULL, 0),
(27, 'Chris', 'Smith', '09952444942', 'Active', NULL, 0),
(28, 'Mia', 'Cruz', '09930568866', 'Active', NULL, 0),
(29, 'Jane', 'Flores', '09280779999', 'Active', NULL, 0),
(30, 'Bea', 'Torres', '09689834063', 'On Leave', NULL, 0),
(31, 'Jane', 'Flores', '09316395606', 'Active', NULL, 0),
(32, 'Josh', 'Garcia', '09815039281', 'Active', NULL, 0),
(33, 'John', 'Reyes', '09572293167', 'Active', NULL, 0),
(34, 'Chris', 'Mendoza', '09378524549', 'Active', NULL, 0),
(35, 'Josh', 'Flores', '09372076037', 'On Leave', NULL, 0),
(36, 'Chloe', 'Torres', '09422262789', 'Active', NULL, 0),
(37, 'Jane', 'Villanueva', '09309802342', 'Active', NULL, 0),
(38, 'John', 'Flores', '09421309962', 'Active', NULL, 0),
(39, 'Emma', 'Smith', '09474103540', 'Active', NULL, 0),
(40, 'Mia', 'Flores', '09871081725', 'On Leave', NULL, 0),
(41, 'Michael', 'Bautista', '09371483472', 'Active', NULL, 0),
(42, 'Josh', 'Cruz', '09230421943', 'Active', NULL, 0),
(43, 'John', 'Cruz', '09222328225', 'Active', NULL, 0),
(44, 'Josh', 'Bautista', '09929879411', 'Active', NULL, 0),
(45, 'John', 'Reyes', '09118274169', 'On Leave', NULL, 0),
(46, 'David', 'Villanueva', '09500505616', 'Active', NULL, 0),
(47, 'Bea', 'Villanueva', '09280275937', 'Active', NULL, 0),
(48, 'Jane', 'Garcia', '09921749087', 'Active', NULL, 0),
(49, 'Sarah', 'Cruz', '09207700531', 'Active', NULL, 0),
(50, 'Bea', 'Torres', '09723575195', 'On Leave', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `staff_roles`
--

CREATE TABLE `staff_roles` (
  `staff_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_roles`
--

INSERT INTO `staff_roles` (`staff_id`, `role_id`) VALUES
(1, 2),
(2, 2),
(3, 1),
(4, 1),
(5, 3),
(6, 3),
(7, 1),
(8, 2),
(9, 1),
(10, 2),
(11, 2),
(12, 1),
(13, 2),
(14, 2),
(15, 2),
(16, 1),
(17, 3),
(18, 1),
(19, 3),
(20, 1),
(21, 2),
(22, 1),
(23, 3),
(24, 3),
(25, 1),
(26, 3),
(27, 1),
(28, 1),
(29, 2),
(30, 2),
(31, 2),
(32, 1),
(33, 1),
(34, 2),
(35, 3),
(36, 1),
(37, 1),
(38, 1),
(39, 1),
(40, 1),
(41, 1),
(42, 1),
(43, 2),
(44, 2),
(45, 2),
(46, 3),
(47, 3),
(48, 3),
(49, 1),
(50, 2);

-- --------------------------------------------------------

--
-- Table structure for table `store_settings`
--

CREATE TABLE `store_settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_settings`
--

INSERT INTO `store_settings` (`key`, `value`) VALUES
('payment_card_enabled', '0'),
('payment_cod_enabled', '0'),
('payment_qr_enabled', '1'),
('qr_code_url', 'http://localhost/PrintokidsPH/uploads/media_6a412f9be433b8.07377837.jpg'),
('shipping_luzon', '150.00'),
('shipping_mindanao', '200.00'),
('shipping_ncr', '80.00'),
('shipping_visayas', '200.00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `event_orders`
--
ALTER TABLE `event_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `event_staff_assignments`
--
ALTER TABLE `event_staff_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `order_services`
--
ALTER TABLE `order_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products_attributes`
--
ALTER TABLE `products_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product_orders`
--
ALTER TABLE `product_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `shipping_address_id` (`shipping_address_id`);

--
-- Indexes for table `product_order_items`
--
ALTER TABLE `product_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff_roles`
--
ALTER TABLE `staff_roles`
  ADD PRIMARY KEY (`staff_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `store_settings`
--
ALTER TABLE `store_settings`
  ADD PRIMARY KEY (`key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `event_orders`
--
ALTER TABLE `event_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `event_staff_assignments`
--
ALTER TABLE `event_staff_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_services`
--
ALTER TABLE `order_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `products_attributes`
--
ALTER TABLE `products_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_orders`
--
ALTER TABLE `product_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_order_items`
--
ALTER TABLE `product_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `customer_addresses_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_orders`
--
ALTER TABLE `event_orders`
  ADD CONSTRAINT `event_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `event_staff_assignments`
--
ALTER TABLE `event_staff_assignments`
  ADD CONSTRAINT `event_staff_assignments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `event_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_staff_assignments_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `event_staff_assignments_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `order_services`
--
ALTER TABLE `order_services`
  ADD CONSTRAINT `order_services_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `event_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `order_services_ibfk_3` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`);

--
-- Constraints for table `products_attributes`
--
ALTER TABLE `products_attributes`
  ADD CONSTRAINT `products_attributes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_orders`
--
ALTER TABLE `product_orders`
  ADD CONSTRAINT `fk_product_orders_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_orders_employee` FOREIGN KEY (`employee_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product_order_items`
--
ALTER TABLE `product_order_items`
  ADD CONSTRAINT `fk_product_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `product_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `staff_roles`
--
ALTER TABLE `staff_roles`
  ADD CONSTRAINT `staff_roles_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
