-- Enhanced Journal System (Rosebud-like features)

-- 1. Extend JournalEntry with mood tracking and more interactive features
ALTER TABLE "JournalEntry" 
ADD COLUMN IF NOT EXISTS "entryType" TEXT DEFAULT 'free_form',
ADD COLUMN IF NOT EXISTS "mood" TEXT,
ADD COLUMN IF NOT EXISTS "moodIntensity" INTEGER,
ADD COLUMN IF NOT EXISTS "energyLevel" TEXT,
ADD COLUMN IF NOT EXISTS "isConversational" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "conversationHistory" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "framework" TEXT, -- CBT, gratitude, dream, etc.
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "weather" TEXT,
ADD COLUMN IF NOT EXISTS "sessionDuration" INTEGER, -- in seconds
ADD COLUMN IF NOT EXISTS "wordCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "parentEntryId" TEXT;

-- 2. Create table for AI-generated prompts
CREATE TABLE IF NOT EXISTS "JournalPrompt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "promptCategory" TEXT NOT NULL, -- morning_reflection, evening_review, mood_check, etc.
  "promptText" TEXT NOT NULL,
  "followUpQuestions" JSONB DEFAULT '[]',
  "framework" TEXT, -- CBT, ACT, IFS, gratitude, etc.
  "isPersonalized" BOOLEAN DEFAULT false,
  "personalizedContext" JSONB,
  "priority" TEXT DEFAULT 'medium',
  "expiresAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "responseEntryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "JournalPrompt_pkey" PRIMARY KEY ("id")
);

-- 3. Create table for journal goals
CREATE TABLE IF NOT EXISTS "JournalGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- personal_growth, mental_health, productivity, relationships, etc.
  "targetMetric" TEXT,
  "targetValue" DOUBLE PRECISION,
  "currentValue" DOUBLE PRECISION DEFAULT 0,
  "frequency" TEXT, -- daily, weekly, monthly
  "status" TEXT DEFAULT 'active',
  "progress" DOUBLE PRECISION DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "targetDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "linkedHabitIds" TEXT[] DEFAULT '{}',
  "reflectionPrompts" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "JournalGoal_pkey" PRIMARY KEY ("id")
);

-- 4. Create table for journal insights (enhanced weekly/monthly reports)
CREATE TABLE IF NOT EXISTS "JournalInsight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodType" TEXT NOT NULL, -- daily, weekly, monthly, yearly
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "moodSummary" JSONB NOT NULL, -- mood trends, averages, patterns
  "themeAnalysis" JSONB NOT NULL, -- recurring themes, topics, concerns
  "progressReport" JSONB NOT NULL, -- goal progress, habit adherence
  "aiRecommendations" JSONB NOT NULL, -- personalized suggestions
  "emotionalPatterns" JSONB,
  "behavioralInsights" JSONB,
  "keyMoments" JSONB, -- significant entries, breakthroughs
  "growthIndicators" JSONB,
  "confidenceScore" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JournalInsight_pkey" PRIMARY KEY ("id")
);

-- 5. Create table for therapeutic frameworks
CREATE TABLE IF NOT EXISTS "TherapeuticFramework" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- therapy, mindfulness, productivity, etc.
  "prompts" JSONB NOT NULL, -- framework-specific prompts
  "exercises" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TherapeuticFramework_pkey" PRIMARY KEY ("id")
);

-- 6. Create table for check-in sessions
CREATE TABLE IF NOT EXISTS "CheckInSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionType" TEXT NOT NULL, -- morning, evening, mood_check, weekly_review
  "mood" TEXT,
  "energyLevel" TEXT,
  "stressLevel" INTEGER,
  "gratitudeItems" TEXT[] DEFAULT '{}',
  "intentions" TEXT[] DEFAULT '{}',
  "accomplishments" TEXT[] DEFAULT '{}',
  "challenges" TEXT[] DEFAULT '{}',
  "tomorrowFocus" TEXT,
  "overallRating" INTEGER,
  "notes" TEXT,
  "linkedEntryId" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CheckInSession_pkey" PRIMARY KEY ("id")
);

-- 7. Create table for journal streaks (separate from general streaks)
CREATE TABLE IF NOT EXISTS "JournalStreak" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "streakType" TEXT NOT NULL, -- daily_entry, morning_checkin, mood_tracking, etc.
  "currentStreak" INTEGER DEFAULT 0,
  "longestStreak" INTEGER DEFAULT 0,
  "lastEntryDate" TIMESTAMP(3),
  "streakStartDate" TIMESTAMP(3),
  "totalEntries" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "JournalStreak_pkey" PRIMARY KEY ("id")
);

-- 8. Add indexes
CREATE INDEX IF NOT EXISTS "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "JournalEntry_entryType_idx" ON "JournalEntry"("entryType");
CREATE INDEX IF NOT EXISTS "JournalEntry_mood_idx" ON "JournalEntry"("mood");
CREATE INDEX IF NOT EXISTS "JournalPrompt_userId_idx" ON "JournalPrompt"("userId");
CREATE INDEX IF NOT EXISTS "JournalPrompt_promptCategory_idx" ON "JournalPrompt"("promptCategory");
CREATE INDEX IF NOT EXISTS "JournalGoal_userId_idx" ON "JournalGoal"("userId");
CREATE INDEX IF NOT EXISTS "JournalGoal_status_idx" ON "JournalGoal"("status");
CREATE INDEX IF NOT EXISTS "JournalInsight_userId_idx" ON "JournalInsight"("userId");
CREATE INDEX IF NOT EXISTS "JournalInsight_periodType_idx" ON "JournalInsight"("periodType");
CREATE INDEX IF NOT EXISTS "CheckInSession_userId_idx" ON "CheckInSession"("userId");
CREATE INDEX IF NOT EXISTS "CheckInSession_sessionType_idx" ON "CheckInSession"("sessionType");
CREATE INDEX IF NOT EXISTS "JournalStreak_userId_idx" ON "JournalStreak"("userId");

-- 9. Add foreign key constraints
ALTER TABLE "JournalPrompt" 
ADD CONSTRAINT "JournalPrompt_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JournalGoal" 
ADD CONSTRAINT "JournalGoal_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JournalInsight" 
ADD CONSTRAINT "JournalInsight_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckInSession" 
ADD CONSTRAINT "CheckInSession_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JournalStreak" 
ADD CONSTRAINT "JournalStreak_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Insert default therapeutic frameworks
INSERT INTO "TherapeuticFramework" ("id", "code", "name", "description", "category", "prompts") VALUES
('tf_1', 'gratitude', 'Gratitude Journal', 'Focus on appreciating positive aspects of life', 'mindfulness', 
 '{"prompts": ["What are three things you''re grateful for today?", "Who made a positive impact on your day?", "What small moment brought you joy today?"]}'),
('tf_2', 'cbt', 'CBT Thought Record', 'Cognitive Behavioral Therapy framework for thought analysis', 'therapy',
 '{"prompts": ["What thoughts are you having right now?", "What evidence supports or contradicts these thoughts?", "How can you reframe this thought more realistically?"]}'),
('tf_3', 'dream', 'Dream Journal', 'Record and analyze your dreams', 'self_discovery',
 '{"prompts": ["Describe your dream in detail", "What emotions did you feel?", "What symbols or themes stood out?"]}'),
('tf_4', 'morning', 'Morning Pages', 'Stream of consciousness morning writing', 'mindfulness',
 '{"prompts": ["Write freely for 10 minutes about whatever comes to mind", "What are your intentions for today?", "How are you feeling as you start your day?"]}'),
('tf_5', 'reflection', 'Daily Reflection', 'End of day review and learning', 'productivity',
 '{"prompts": ["What went well today?", "What could have gone better?", "What did you learn today?", "How will you apply this learning tomorrow?"]}')
ON CONFLICT (code) DO NOTHING;

-- 11. Create unique constraints
ALTER TABLE "JournalStreak" 
ADD CONSTRAINT "JournalStreak_userId_streakType_key" 
UNIQUE ("userId", "streakType");

-- 12. Add parent entry relationship for conversation threading
ALTER TABLE "JournalEntry"
ADD CONSTRAINT "JournalEntry_parentEntryId_fkey"
FOREIGN KEY ("parentEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;