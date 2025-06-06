-- Add Personal Analytics & Insights Models

-- PersonalInsight table
CREATE TABLE "PersonalInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dataPoints" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT[],
    "timeframe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "PersonalInsight_pkey" PRIMARY KEY ("id")
);

-- MoodEntry table
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "energyLevel" TEXT NOT NULL,
    "notes" TEXT,
    "triggers" TEXT[],
    "activities" TEXT[],
    "location" TEXT,
    "weather" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- LifeMetric table
CREATE TABLE "LifeMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rawValue" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifeMetric_pkey" PRIMARY KEY ("id")
);

-- CoachingSuggestion table
CREATE TABLE "CoachingSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "basedOn" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CoachingSuggestion_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PersonalInsight
CREATE INDEX "PersonalInsight_userId_idx" ON "PersonalInsight"("userId");
CREATE INDEX "PersonalInsight_insightType_idx" ON "PersonalInsight"("insightType");
CREATE INDEX "PersonalInsight_status_idx" ON "PersonalInsight"("status");
CREATE INDEX "PersonalInsight_priority_idx" ON "PersonalInsight"("priority");
CREATE INDEX "PersonalInsight_createdAt_idx" ON "PersonalInsight"("createdAt");

-- Create indexes for MoodEntry
CREATE INDEX "MoodEntry_userId_idx" ON "MoodEntry"("userId");
CREATE INDEX "MoodEntry_recordedAt_idx" ON "MoodEntry"("recordedAt");
CREATE INDEX "MoodEntry_mood_idx" ON "MoodEntry"("mood");
CREATE INDEX "MoodEntry_energyLevel_idx" ON "MoodEntry"("energyLevel");

-- Create indexes for LifeMetric
CREATE INDEX "LifeMetric_userId_idx" ON "LifeMetric"("userId");
CREATE INDEX "LifeMetric_metricType_idx" ON "LifeMetric"("metricType");
CREATE INDEX "LifeMetric_recordedAt_idx" ON "LifeMetric"("recordedAt");
CREATE INDEX "LifeMetric_source_idx" ON "LifeMetric"("source");

-- Create indexes for CoachingSuggestion
CREATE INDEX "CoachingSuggestion_userId_idx" ON "CoachingSuggestion"("userId");
CREATE INDEX "CoachingSuggestion_category_idx" ON "CoachingSuggestion"("category");
CREATE INDEX "CoachingSuggestion_status_idx" ON "CoachingSuggestion"("status");
CREATE INDEX "CoachingSuggestion_priority_idx" ON "CoachingSuggestion"("priority");
CREATE INDEX "CoachingSuggestion_createdAt_idx" ON "CoachingSuggestion"("createdAt");

-- Add foreign key constraints
ALTER TABLE "PersonalInsight" ADD CONSTRAINT "PersonalInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LifeMetric" ADD CONSTRAINT "LifeMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachingSuggestion" ADD CONSTRAINT "CoachingSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;