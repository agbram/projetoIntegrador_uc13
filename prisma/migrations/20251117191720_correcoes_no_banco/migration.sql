/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `production_tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "production_tasks_productId_key" ON "production_tasks"("productId");
