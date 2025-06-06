-- Fix user XP values for correct level progression

-- Update all users to have correct currentXP and levels
DO $$
DECLARE
    user_record RECORD;
    current_xp INTEGER;
    total_xp INTEGER;
    current_level INTEGER;
    xp_for_level INTEGER;
BEGIN
    -- Loop through all users with levels
    FOR user_record IN 
        SELECT "userId", "totalXP", "level"
        FROM "UserLevel"
    LOOP
        total_xp := user_record."totalXP";
        current_level := 1;
        current_xp := total_xp;
        
        -- Calculate correct level and currentXP
        WHILE current_xp >= FLOOR(100 * POWER(1.2, current_level - 1)) LOOP
            current_xp := current_xp - FLOOR(100 * POWER(1.2, current_level - 1));
            current_level := current_level + 1;
        END LOOP;
        
        -- Calculate XP needed for next level
        xp_for_level := FLOOR(100 * POWER(1.2, current_level - 1));
        
        -- Update the user's level data
        UPDATE "UserLevel" 
        SET 
            "level" = current_level,
            "currentXP" = current_xp,
            "xpToNextLevel" = xp_for_level,
            "title" = CASE 
                WHEN current_level < 5 THEN 'Beginner'
                WHEN current_level < 10 THEN 'Explorer'
                WHEN current_level < 20 THEN 'Achiever'
                WHEN current_level < 35 THEN 'Expert'
                WHEN current_level < 50 THEN 'Master'
                ELSE 'Grandmaster'
            END,
            "updatedAt" = NOW()
        WHERE "userId" = user_record."userId";
        
    END LOOP;
END $$;