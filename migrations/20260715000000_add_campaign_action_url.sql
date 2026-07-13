ALTER TABLE "public"."pos_campaigns" ADD COLUMN IF NOT EXISTS "action_url" text;

UPDATE "public"."pos_campaigns" 
SET "action_url" = '/liff/mystery-box' 
WHERE "title" ILIKE '%กล่องสุ่ม%';
