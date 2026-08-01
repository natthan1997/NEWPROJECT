ALTER TABLE public.pos_shop_settings
ADD COLUMN IF NOT EXISTS custom_roles JSONB DEFAULT '[{"id": "manager", "label": "ผู้จัดการสาขา (Manager)", "is_system": true}, {"id": "staff", "label": "พนักงานทั่วไป (Staff)", "is_system": true}]'::jsonb;
