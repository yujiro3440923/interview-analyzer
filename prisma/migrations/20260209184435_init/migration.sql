-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupName" TEXT
);

-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" TEXT,
    "name" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    CONSTRAINT "Person_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "action" TEXT,
    "sentimentScore" REAL,
    "topics" TEXT,
    "keywords" TEXT,
    "personId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    CONSTRAINT "InterviewRecord_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InterviewRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_batchId_name_key" ON "Person"("batchId", "name");
