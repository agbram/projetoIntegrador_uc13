/*
  Warnings:

  - You are about to drop the column `description` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `purchase_items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `supplyId` to the `purchase_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "supplies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "unitPrice" REAL,
    "stockQty" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_purchase_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseId" INTEGER NOT NULL,
    "supplyId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "supply_purchases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_items_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_purchase_items" ("createdAt", "id", "purchaseId", "quantity", "subtotal", "unitPrice", "updatedAt") SELECT "createdAt", "id", "purchaseId", "quantity", "subtotal", "unitPrice", "updatedAt" FROM "purchase_items";
DROP TABLE "purchase_items";
ALTER TABLE "new_purchase_items" RENAME TO "purchase_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
