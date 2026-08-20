-- AlterTable
ALTER TABLE `site_settings`
  ADD COLUMN `zalo_link` VARCHAR(500) NULL DEFAULT 'https://zalo.me',
  ADD COLUMN `completed_lessons_stat` VARCHAR(50) NULL DEFAULT '5,000+';
