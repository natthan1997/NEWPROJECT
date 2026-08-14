ALTER TABLE "public"."pos_loyalty_coupons" ADD COLUMN IF NOT EXISTS "is_birthday_only" BOOLEAN DEFAULT false;
