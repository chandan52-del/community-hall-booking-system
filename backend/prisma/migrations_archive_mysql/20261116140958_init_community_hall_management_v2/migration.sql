-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `organization` VARCHAR(191) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `halls` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `area` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL DEFAULT 'Bengaluru',
    `pincode` VARCHAR(20) NOT NULL,
    `description` TEXT NOT NULL,
    `seated_capacity` INTEGER NOT NULL,
    `floating_capacity` INTEGER NOT NULL,
    `dining_capacity` INTEGER NOT NULL DEFAULT 0,
    `base_rate_per_day` DECIMAL(10, 2) NOT NULL,
    `hourly_rate` DECIMAL(10, 2) NULL,
    `cleaning_fee` DECIMAL(10, 2) NOT NULL,
    `deposit_required` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `halls_area_idx`(`area`),
    INDEX `halls_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `amenities` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hall_amenities` (
    `hall_id` VARCHAR(64) NOT NULL,
    `amenity_id` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`hall_id`, `amenity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hall_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hall_id` VARCHAR(64) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `hall_images_hall_id_idx`(`hall_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(36) NOT NULL,
    `hall_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `event_date` VARCHAR(10) NOT NULL,
    `start_time` VARCHAR(10) NOT NULL,
    `end_time` VARCHAR(10) NOT NULL,
    `guests_count` INTEGER NOT NULL,
    `contact_name` VARCHAR(191) NOT NULL,
    `contact_email` VARCHAR(191) NOT NULL,
    `contact_phone` VARCHAR(50) NOT NULL,
    `special_requests` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `rejection_reason` TEXT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bookings_hall_id_event_date_idx`(`hall_id`, `event_date`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_contact_email_idx`(`contact_email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_schedules` (
    `id` VARCHAR(36) NOT NULL,
    `hall_id` VARCHAR(64) NOT NULL,
    `start_date` VARCHAR(10) NOT NULL,
    `end_date` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `maintenance_schedules_hall_id_start_date_end_date_idx`(`hall_id`, `start_date`, `end_date`),
    INDEX `maintenance_schedules_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hall_amenities` ADD CONSTRAINT `hall_amenities_hall_id_fkey` FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hall_amenities` ADD CONSTRAINT `hall_amenities_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `amenities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hall_images` ADD CONSTRAINT `hall_images_hall_id_fkey` FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_hall_id_fkey` FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_schedules` ADD CONSTRAINT `maintenance_schedules_hall_id_fkey` FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
