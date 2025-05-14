/*
  Warnings:

  - The primary key for the `payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CARD_ID` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `PAID` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `PAYMENT_DATE` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `PAYMENT_ID` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `PAYMENT_METHOD` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `STATUS` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `USER_ID` on the `payments` table. All the data in the column will be lost.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debtId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `payments` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `paymentMethod` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `FK_PAYMENTS`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `FK_PAYMENTS1`;

-- DropIndex
DROP INDEX `FK_PAYMENTS` ON `payments`;

-- DropIndex
DROP INDEX `FK_PAYMENTS1` ON `payments`;

-- AlterTable
ALTER TABLE `payments` DROP PRIMARY KEY,
    DROP COLUMN `CARD_ID`,
    DROP COLUMN `PAID`,
    DROP COLUMN `PAYMENT_DATE`,
    DROP COLUMN `PAYMENT_ID`,
    DROP COLUMN `PAYMENT_METHOD`,
    DROP COLUMN `STATUS`,
    DROP COLUMN `USER_ID`,
    ADD COLUMN `amount` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `cardId` INTEGER NULL,
    ADD COLUMN `date` DATETIME(3) NOT NULL,
    ADD COLUMN `debtId` VARCHAR(191) NOT NULL,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `plaidtransaction` ADD COLUMN `pfc_primary` VARCHAR(191) NULL,
    ADD COLUMN `transaction_type` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `payments_cardId_idx` ON `payments`(`cardId`);

-- CreateIndex
CREATE INDEX `payments_userId_idx` ON `payments`(`userId`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `FK_PAYMENTS_CARD` FOREIGN KEY (`cardId`) REFERENCES `credit_cards`(`CARD_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `FK_PAYMENTS_USER` FOREIGN KEY (`userId`) REFERENCES `users`(`USER_ID`) ON DELETE SET NULL ON UPDATE CASCADE;
