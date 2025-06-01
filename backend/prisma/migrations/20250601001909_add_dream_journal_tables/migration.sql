-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dreamDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emotions" JSONB,
    "themes" JSONB,
    "symbols" JSONB,
    "lucidity" INTEGER DEFAULT 0,
    "clarity" INTEGER DEFAULT 5,
    "mood" TEXT,
    "analysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamTag" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DreamTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamInsight" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DreamInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DreamPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dream_userId_idx" ON "Dream"("userId");

-- CreateIndex
CREATE INDEX "Dream_dreamDate_idx" ON "Dream"("dreamDate");

-- CreateIndex
CREATE INDEX "DreamTag_tag_idx" ON "DreamTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "DreamTag_dreamId_tag_key" ON "DreamTag"("dreamId", "tag");

-- CreateIndex
CREATE INDEX "DreamInsight_dreamId_idx" ON "DreamInsight"("dreamId");

-- CreateIndex
CREATE INDEX "DreamInsight_type_idx" ON "DreamInsight"("type");

-- CreateIndex
CREATE INDEX "DreamPattern_userId_idx" ON "DreamPattern"("userId");

-- CreateIndex
CREATE INDEX "DreamPattern_patternType_idx" ON "DreamPattern"("patternType");

-- CreateIndex
CREATE UNIQUE INDEX "DreamPattern_userId_patternType_patternKey_key" ON "DreamPattern"("userId", "patternType", "patternKey");

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamTag" ADD CONSTRAINT "DreamTag_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamInsight" ADD CONSTRAINT "DreamInsight_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamPattern" ADD CONSTRAINT "DreamPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
