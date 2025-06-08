# API Testing Examples for Achievement Fix

## To manually trigger achievement checks for a user:

```bash
# Get user's gamification status
curl -X GET "http://localhost:5002/api/gamification/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Manually trigger achievement check
curl -X POST "http://localhost:5002/api/gamification/check-achievements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get updated achievements list  
curl -X GET "http://localhost:5002/api/gamification/achievements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## What was fixed:

1. **Missing Achievement Logic**: Added support for `habit_streak_3` (Consistency achievement) in gamificationRoutes.ts
2. **Additional Missing Achievements**: Added support for `first_habit`, `mood_logger_1`, `dream_journal_1`, `decision_maker`, and `insight_seeker`
3. **Database Query Consistency**: Fixed `findFirst` vs `findUnique` consistency in gamificationHelper.ts
4. **Retroactive Fix**: Created scripts to award missing achievements to existing users

## Verification:

- ✅ Achievement system now properly recognizes 3-day habit streaks
- ✅ Existing users received missing achievements retroactively  
- ✅ All streak achievements (3, 7, 30 days) are now working
- ✅ Manual achievement check endpoint is available for debugging

## Usage:

The achievement system will automatically check and award achievements when:
- Users complete habits (triggers streak updates and achievement checks)
- Users gain XP (triggers achievement checks)
- Manual trigger via API endpoint

Users with 3+ day habit streaks will now properly receive the "Consistency" achievement (🔥 75 XP).