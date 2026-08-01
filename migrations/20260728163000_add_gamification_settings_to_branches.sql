-- Add gamification_settings column to branches table
-- This column will store JSON configuration for the gamification UI (targets and rewards)

ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS gamification_settings JSONB DEFAULT '{
  "salesTarget": 100000,
  "salesReward": "โบนัสทีม 5,000.-",
  "attendanceTarget": 3,
  "attendanceReward": "เบี้ยขยัน 1,000.-",
  "memberTarget": 200,
  "memberReward": "โบนัสพิเศษ 2,000.-"
}'::jsonb;
