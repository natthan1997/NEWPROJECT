ALTER TABLE public.pos_merchants ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'monthly';
ALTER TABLE public.pos_merchants ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';
ALTER TABLE public.pos_merchants ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pos_merchants_subscription_type_check'
  ) THEN
    ALTER TABLE public.pos_merchants
      ADD CONSTRAINT pos_merchants_subscription_type_check
      CHECK (subscription_type IN ('monthly', 'yearly', 'free', 'trial'));
  END IF;
END $$;
