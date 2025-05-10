-- AlterTable
ALTER TABLE `debt` ADD COLUMN `type` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `debt_payment` (
    `id` VARCHAR(191) NOT NULL,
    `debtId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `debt_payment_debtId_idx`(`debtId`),
    INDEX `debt_payment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `debt_payment` ADD CONSTRAINT `debt_payment_debtId_fkey` FOREIGN KEY (`debtId`) REFERENCES `debt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
