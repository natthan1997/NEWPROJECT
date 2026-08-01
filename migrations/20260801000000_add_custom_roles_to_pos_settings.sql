-- Add custom_roles column to pos_shop_settings table
ALTER TABLE public.pos_shop_settings
ADD COLUMN IF NOT EXISTS custom_roles JSONB DEFAULT '[{"id": "manager", "label": "ผู้จัดการสาขา (Manager)", "is_system": true}, {"id": "staff", "label": "พนักงานทั่วไป (Staff)", "is_system": true}]'::jsonb;

-- Ensure role_permissions uses standard defaults if null
UPDATE public.pos_shop_settings
SET role_permissions = '{
  "manager": ["pos:access", "pos:checkout", "pos:void", "pos:discount", "pos:drawer", "reports:view", "reports:sales", "reports:profit", "reports:export", "inventory:view", "inventory:edit", "inventory:audit", "kitchen:view", "staff:view", "staff:manage", "settings:view", "settings:manage", "line-notify-stock", "line-notify-audit", "line-notify-zreport", "line-notify-checkout-photos"],
  "staff": ["pos:access", "pos:checkout", "kitchen:view", "inventory:view"]
}'::jsonb
WHERE role_permissions IS NULL OR role_permissions::text = '{}';
