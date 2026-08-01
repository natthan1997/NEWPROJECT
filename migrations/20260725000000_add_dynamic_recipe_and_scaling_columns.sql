-- Add dynamic recipe columns to pos_menu_modifiers
ALTER TABLE public.pos_menu_modifiers ADD COLUMN IF NOT EXISTS is_substitution BOOLEAN DEFAULT false;
ALTER TABLE public.pos_menu_modifiers ADD COLUMN IF NOT EXISTS substitute_target_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL;
ALTER TABLE public.pos_menu_modifiers ADD COLUMN IF NOT EXISTS is_contextual_roast BOOLEAN DEFAULT false;
ALTER TABLE public.pos_menu_modifiers ADD COLUMN IF NOT EXISTS sweetness_multiplier DECIMAL(5,2) DEFAULT 1.00;

-- Add compensation columns to pos_menu_items
ALTER TABLE public.pos_menu_items ADD COLUMN IF NOT EXISTS auto_topup_base_liquid BOOLEAN DEFAULT true;
ALTER TABLE public.pos_menu_items ADD COLUMN IF NOT EXISTS target_liquid_ml DECIMAL(8,2) DEFAULT 0.00;
