/*
  Warnings:

  - You are about to drop the `purchase_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supply_purchases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `stockQuantity` on the `products` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "purchase_items_supplyId_idx";

-- DropIndex
DROP INDEX "purchase_items_purchaseId_idx";

-- DropIndex
DROP INDEX "supplies_name_idx";

-- DropIndex
DROP INDEX "supply_purchases_supplier_idx";

-- DropIndex
DROP INDEX "supply_purchases_purchaseDate_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "purchase_items";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supplies";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supply_purchases";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fotoUrl" TEXT,
    "category" TEXT NOT NULL,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "markupPercent" REAL NOT NULL DEFAULT 0,
    "salePrice" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("category", "costPrice", "createdAt", "description", "fotoUrl", "id", "isActive", "markupPercent", "name", "salePrice", "updatedAt") SELECT "category", "costPrice", "createdAt", "description", "fotoUrl", "id", "isActive", "markupPercent", "name", "salePrice", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "products_salePrice_idx" ON "products"("salePrice");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
