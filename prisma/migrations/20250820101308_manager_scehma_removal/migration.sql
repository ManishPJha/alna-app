/*
  Warnings:

  - You are about to drop the `managers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."managers" DROP CONSTRAINT "managers_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."managers" DROP CONSTRAINT "managers_userId_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "restaurantId" TEXT;

-- DropTable
DROP TABLE "public"."managers";

-- CreateIndex
CREATE INDEX "idx_users_restaurant_id" ON "public"."users"("restaurantId");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "public"."users"("role");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
