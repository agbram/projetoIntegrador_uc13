-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fixed_expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_fixed_expenses" ("category", "createdAt", "date", "description", "id", "note", "recurring", "updatedAt", "value") SELECT "category", "createdAt", "date", "description", "id", "note", "recurring", "updatedAt", "value" FROM "fixed_expenses";
DROP TABLE "fixed_expenses";
ALTER TABLE "new_fixed_expenses" RENAME TO "fixed_expenses";
CREATE INDEX "fixed_expenses_date_idx" ON "fixed_expenses"("date");
CREATE INDEX "fixed_expenses_category_idx" ON "fixed_expenses"("category");
CREATE INDEX "fixed_expenses_recurring_idx" ON "fixed_expenses"("recurring");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
