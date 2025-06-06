-- Add Gamification System

-- UserLevel table
CREATE TABLE "UserLevel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXP" INTEGER NOT NULL DEFAULT 0,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "title" TEXT NOT NULL DEFAULT 'Beginner',
    "unlockedFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevel_pkey" PRIMARY KEY ("id")
);

-- Achievement table
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "rarity" TEXT NOT NULL,
    "requirement" JSONB NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- UserAchievement table
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- Streak table
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "streakStartDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- Reward table
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "cost" INTEGER,
    "requiredLevel" INTEGER,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- UserReward table
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- DailyChallenge table
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirement" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "bonusXP" INTEGER,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- DailyChallengeCompletion table
CREATE TABLE "DailyChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bonusEarned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "UserLevel_userId_key" ON "UserLevel"("userId");
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE UNIQUE INDEX "Streak_userId_type_targetId_key" ON "Streak"("userId", "type", "targetId");
CREATE UNIQUE INDEX "UserReward_userId_rewardId_key" ON "UserReward"("userId", "rewardId");
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");
CREATE UNIQUE INDEX "DailyChallengeCompletion_userId_challengeId_key" ON "DailyChallengeCompletion"("userId", "challengeId");

-- Create indexes
CREATE INDEX "UserLevel_userId_idx" ON "UserLevel"("userId");
CREATE INDEX "UserLevel_level_idx" ON "UserLevel"("level");
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");
CREATE INDEX "Achievement_rarity_idx" ON "Achievement"("rarity");
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");
CREATE INDEX "UserAchievement_earnedAt_idx" ON "UserAchievement"("earnedAt");
CREATE INDEX "Streak_userId_idx" ON "Streak"("userId");
CREATE INDEX "Streak_type_idx" ON "Streak"("type");
CREATE INDEX "Streak_isActive_idx" ON "Streak"("isActive");
CREATE INDEX "Reward_type_idx" ON "Reward"("type");
CREATE INDEX "Reward_category_idx" ON "Reward"("category");
CREATE INDEX "UserReward_userId_idx" ON "UserReward"("userId");
CREATE INDEX "UserReward_rewardId_idx" ON "UserReward"("rewardId");
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date");
CREATE INDEX "DailyChallenge_type_idx" ON "DailyChallenge"("type");
CREATE INDEX "DailyChallengeCompletion_userId_idx" ON "DailyChallengeCompletion"("userId");
CREATE INDEX "DailyChallengeCompletion_challengeId_idx" ON "DailyChallengeCompletion"("challengeId");

-- Add foreign key constraints
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert initial achievements
INSERT INTO "Achievement" ("id", "code", "name", "description", "category", "icon", "xpReward", "rarity", "requirement", "sortOrder") VALUES
('ach_first_habit', 'first_habit', 'Getting Started', 'Created your first habit', 'habits', '🌱', 50, 'common', '{"type": "habit_count", "value": 1}', 1),
('ach_habit_streak_3', 'habit_streak_3', 'Consistency', 'Maintained a 3-day habit streak', 'habits', '🔥', 75, 'common', '{"type": "streak", "value": 3}', 2),
('ach_habit_streak_7', 'habit_streak_7', 'Week Warrior', 'Maintained a 7-day habit streak', 'habits', '⚡', 150, 'rare', '{"type": "streak", "value": 7}', 3),
('ach_habit_streak_30', 'habit_streak_30', 'Monthly Master', 'Maintained a 30-day habit streak', 'habits', '👑', 500, 'epic', '{"type": "streak", "value": 30}', 4),
('ach_mood_logger_1', 'mood_logger_1', 'Mood Tracker', 'Logged your first mood entry', 'mood', '😊', 25, 'common', '{"type": "mood_count", "value": 1}', 5),
('ach_mood_logger_30', 'mood_logger_30', 'Emotional Intelligence', 'Logged mood for 30 days', 'mood', '🧠', 200, 'rare', '{"type": "mood_count", "value": 30}', 6),
('ach_dream_journal_1', 'dream_journal_1', 'Dream Explorer', 'Recorded your first dream', 'dreams', '🌙', 30, 'common', '{"type": "dream_count", "value": 1}', 7),
('ach_dream_journal_10', 'dream_journal_10', 'Dream Keeper', 'Recorded 10 dreams', 'dreams', '✨', 100, 'rare', '{"type": "dream_count", "value": 10}', 8),
('ach_decision_maker', 'decision_maker', 'Decision Maker', 'Made your first analyzed decision', 'decisions', '⚖️', 75, 'common', '{"type": "decision_count", "value": 1}', 9),
('ach_insight_seeker', 'insight_seeker', 'Insight Seeker', 'Generated your first AI insights', 'insights', '💡', 100, 'rare', '{"type": "insight_count", "value": 1}', 10),
('ach_early_adopter', 'early_adopter', 'Early Adopter', 'Joined Nexus in its early days', 'special', '🚀', 250, 'legendary', '{"type": "registration_date", "before": "2025-12-31"}', 11);

-- Insert initial rewards
INSERT INTO "Reward" ("id", "name", "description", "type", "value", "requiredLevel", "icon", "category") VALUES
('reward_badge_bronze', 'Bronze Badge', 'A shiny bronze achievement badge', 'badge', 'bronze', 5, '🥉', 'badges'),
('reward_badge_silver', 'Silver Badge', 'A prestigious silver achievement badge', 'badge', 'silver', 15, '🥈', 'badges'),
('reward_badge_gold', 'Gold Badge', 'An exclusive gold achievement badge', 'badge', 'gold', 30, '🥇', 'badges'),
('reward_theme_dark', 'Dark Theme', 'Sleek dark mode theme', 'theme', 'dark', 10, '🌙', 'themes'),
('reward_theme_ocean', 'Ocean Theme', 'Calming ocean blue theme', 'theme', 'ocean', 20, '🌊', 'themes'),
('reward_title_explorer', 'Explorer Title', 'Show off your adventurous spirit', 'title', 'Explorer', 8, '🗺️', 'titles'),
('reward_title_master', 'Master Title', 'Display your mastery and expertise', 'title', 'Master', 25, '🎓', 'titles');

-- Insert today's daily challenge
INSERT INTO "DailyChallenge" ("id", "date", "type", "description", "requirement", "xpReward", "icon") VALUES
('challenge_today', CURRENT_DATE, 'habit_completion', 'Complete at least one habit today', '{"type": "habit_completion", "count": 1}', 25, '✅');