-- AlterTable
ALTER TABLE `exam_submissions` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1 AFTER `graded_at`;

-- CreateTable
CREATE TABLE `idempotency_records` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `payload_hash` VARCHAR(64) NOT NULL,
    `response_payload` JSON NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'COMMITTED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `idempotency_records_submission_id_key_key`(`submission_id`, `key`),
    INDEX `idempotency_records_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(64) NOT NULL,
    `actor_id` VARCHAR(191) NOT NULL,
    `actor_role` VARCHAR(32) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `exam_id` VARCHAR(191) NOT NULL,
    `request_id` VARCHAR(64) NOT NULL,
    `idempotency_key_hash` VARCHAR(64) NULL,
    `old_state` TEXT NULL,
    `new_state` TEXT NULL,
    `result_summary` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_outbox_submission_id_idx`(`submission_id`),
    INDEX `audit_outbox_event_type_idx`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
