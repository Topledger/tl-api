-- Update all users to have 1000 credits (Basic plan)
-- Run this SQL script to update existing users after schema change

UPDATE "User" SET credits = 1000;

-- Verify the update
SELECT 
  credits, 
  COUNT(*) as user_count
FROM "User" 
GROUP BY credits 
ORDER BY credits;

-- Show total user count
SELECT 
  COUNT(*) as total_users,
  MIN(credits) as min_credits,
  MAX(credits) as max_credits,
  AVG(credits) as avg_credits
FROM "User";