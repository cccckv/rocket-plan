-- CreateTable
CREATE TABLE "VideoTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "generationId" TEXT,
    "status" TEXT NOT NULL,
    "resultUrl" TEXT,
    "localPath" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "metadata" TEXT,
    "errorMsg" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoTask_userId_status_idx" ON "VideoTask"("userId", "status");

-- CreateIndex
CREATE INDEX "VideoTask_status_idx" ON "VideoTask"("status");

-- CreateIndex
CREATE INDEX "VideoTask_generationId_idx" ON "VideoTask"("generationId");
