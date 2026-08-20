BEGIN;

-- 1. Create pos_merchants table if not exists
CREATE TABLE IF NOT EXISTS public.pos_merchants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    logo_url text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Insert Default Merchant (XYL STUDIO)
INSERT INTO public.pos_merchants (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'XYL STUDIO')
ON CONFLICT (id) DO NOTHING;

-- 3. Add merchant_id to profiles, branches, and all POS tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_members ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_orders ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_menu_items ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_menu_categories ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_menu_modifiers ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_zones ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_tables ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_shifts ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_loyalty_coupons ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_member_coupons ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_points_history ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;
ALTER TABLE public.pos_qr_reward_tokens ADD COLUMN IF NOT EXISTS merchant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES public.pos_merchants(id) ON DELETE SET NULL;

-- 4. Recreate pos_checkout_order function to handle merchant_id
CREATE OR REPLACE FUNCTION pos_checkout_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id uuid;
    v_table_id uuid;
    v_order_action text;
    v_merchant_id uuid;
    v_item jsonb;
    v_mov jsonb;
    v_pay jsonb;
    v_hist jsonb;
BEGIN
    v_order_action := payload->>'order_action';
    v_merchant_id := COALESCE((payload->'order'->>'merchant_id')::uuid, '00000000-0000-0000-0000-000000000000');
    
    IF payload->'order' ? 'table_id' AND payload->'order'->>'table_id' IS NOT NULL THEN
        v_table_id := (payload->'order'->>'table_id')::uuid;
        PERFORM id FROM pos_tables WHERE id = v_table_id FOR UPDATE;
    END IF;

    IF v_order_action = 'insert' THEN
        v_order_id := gen_random_uuid();
        INSERT INTO pos_orders (
            id, order_number, staff_id, shift_id, branch_id, status, 
            total_amount, net_total, tax_amount, service_charge_amount, 
            discount_amount, customer_id, order_type, table_id, table_number, 
            queue_number, payment_method, order_source, paid_at, 
            delivery_platform, delivery_gp_amount, reference_name, promo_code,
            merchant_id
        ) VALUES (
            v_order_id,
            payload->'order'->>'order_number',
            (payload->'order'->>'staff_id')::uuid,
            (payload->'order'->>'shift_id')::uuid,
            (payload->'order'->>'branch_id')::uuid,
            payload->'order'->>'status',
            COALESCE((payload->'order'->>'total_amount')::numeric, 0),
            COALESCE((payload->'order'->>'net_total')::numeric, 0),
            COALESCE((payload->'order'->>'tax_amount')::numeric, 0),
            COALESCE((payload->'order'->>'service_charge_amount')::numeric, 0),
            COALESCE((payload->'order'->>'discount_amount')::numeric, 0),
            (payload->'order'->>'customer_id')::uuid,
            payload->'order'->>'order_type',
            v_table_id,
            payload->'order'->>'table_number',
            NULLIF(payload->'order'->>'queue_number', '')::integer,
            payload->'order'->>'payment_method',
            COALESCE(payload->'order'->>'order_source', 'pos'),
            (payload->'order'->>'paid_at')::timestamptz,
            payload->'order'->>'delivery_platform',
            (payload->'order'->>'delivery_gp_amount')::numeric,
            payload->'order'->>'reference_name',
            payload->'order'->>'promo_code',
            v_merchant_id
        );
    ELSE
        v_order_id := (payload->>'order_id')::uuid;
        UPDATE pos_orders SET
            status = payload->'order'->>'status',
            total_amount = COALESCE((payload->'order'->>'total_amount')::numeric, total_amount),
            net_total = COALESCE((payload->'order'->>'net_total')::numeric, net_total),
            tax_amount = COALESCE((payload->'order'->>'tax_amount')::numeric, tax_amount),
            service_charge_amount = COALESCE((payload->'order'->>'service_charge_amount')::numeric, service_charge_amount),
            discount_amount = COALESCE((payload->'order'->>'discount_amount')::numeric, discount_amount),
            customer_id = (payload->'order'->>'customer_id')::uuid,
            order_type = payload->'order'->>'order_type',
            table_id = v_table_id,
            table_number = payload->'order'->>'table_number',
            queue_number = NULLIF(payload->'order'->>'queue_number', '')::integer,
            payment_method = payload->'order'->>'payment_method',
            paid_at = (payload->'order'->>'paid_at')::timestamptz,
            delivery_platform = payload->'order'->>'delivery_platform',
            delivery_gp_amount = (payload->'order'->>'delivery_gp_amount')::numeric,
            reference_name = payload->'order'->>'reference_name',
            promo_code = payload->'order'->>'promo_code',
            merchant_id = v_merchant_id
        WHERE id = v_order_id;
        
        DELETE FROM pos_order_items WHERE order_id = v_order_id AND status != 'cancelled';
    END IF;

    IF payload ? 'order_items' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'order_items')
        LOOP
            INSERT INTO pos_order_items (
                order_id, item_id, quantity, unit_price, cost_price, subtotal, 
                selected_modifiers, customer_name, discount_amount, discount_reason
            ) VALUES (
                v_order_id,
                (v_item->>'item_id')::uuid,
                COALESCE((v_item->>'quantity')::int, 1),
                COALESCE((v_item->>'unit_price')::numeric, 0),
                COALESCE((v_item->>'cost_price')::numeric, 0),
                COALESCE((v_item->>'subtotal')::numeric, 0),
                v_item->'selected_modifiers',
                v_item->>'customer_name',
                COALESCE((v_item->>'discount_amount')::numeric, 0),
                v_item->>'discount_reason'
            );
        END LOOP;
    END IF;

    IF payload ? 'movements' THEN
        FOR v_mov IN SELECT * FROM jsonb_array_elements(payload->'movements')
        LOOP
            INSERT INTO inventory_movements (item_id, change_amount, new_quantity, reason, reference_id)
            VALUES (
                (v_mov->>'item_id')::uuid,
                (v_mov->>'change_amount')::numeric,
                (v_mov->>'new_quantity')::numeric,
                v_mov->>'reason',
                v_order_id::text
            );
        END LOOP;
    END IF;

    IF payload ? 'payments' THEN
        FOR v_pay IN SELECT * FROM jsonb_array_elements(payload->'payments')
        LOOP
            INSERT INTO pos_order_payments (order_id, payment_method, amount, status)
            VALUES (
                v_order_id,
                v_pay->>'payment_method',
                COALESCE((v_pay->>'amount')::numeric, 0),
                COALESCE(v_pay->>'status', 'paid')
            );
        END LOOP;
    END IF;

    IF payload ? 'member_id' AND payload->>'member_id' IS NOT NULL THEN
        UPDATE pos_members 
        SET points = points - COALESCE((payload->>'points_to_deduct')::int, 0) + COALESCE((payload->>'points_earned')::int, 0)
        WHERE id = (payload->>'member_id')::uuid;
        
        IF payload ? 'points_history' THEN
            FOR v_hist IN SELECT * FROM jsonb_array_elements(payload->'points_history')
            LOOP
                INSERT INTO pos_points_history (member_id, order_id, points, points_change, type, description, merchant_id)
                VALUES (
                    (payload->>'member_id')::uuid,
                    v_order_id,
                    COALESCE((v_hist->>'points')::int, 0),
                    COALESCE((v_hist->>'points_change')::int, 0),
                    v_hist->>'type',
                    v_hist->>'description',
                    v_merchant_id
                );
            END LOOP;
        END IF;
        
        IF payload ? 'coupon_id_to_mark_used' AND payload->>'coupon_id_to_mark_used' IS NOT NULL THEN
            UPDATE pos_member_coupons
            SET status = 'used', used_at = now()
            WHERE id = (payload->>'coupon_id_to_mark_used')::uuid;
        END IF;
    END IF;

    IF payload ? 'table_id_to_clear' AND payload->>'table_id_to_clear' IS NOT NULL THEN
        UPDATE pos_tables SET status = 'available' WHERE id = (payload->>'table_id_to_clear')::uuid;
        UPDATE pos_tables SET parent_table_id = null WHERE parent_table_id = (payload->>'table_id_to_clear')::uuid;
        UPDATE pos_tables SET parent_table_id = null WHERE id = (payload->>'table_id_to_clear')::uuid;
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Checkout Failed: %', SQLERRM;
END;
$$;

-- 5. Trigger function to auto-assign merchant_id
CREATE OR REPLACE FUNCTION public.set_merchant_id_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_merchant_id uuid;
BEGIN
    -- Try to get from auth.uid()
    IF auth.uid() IS NOT NULL THEN
        SELECT merchant_id INTO v_merchant_id FROM public.profiles WHERE id = auth.uid();
    END IF;
    
    -- Assign merchant_id if NULL
    IF NEW.merchant_id IS NULL THEN
        NEW.merchant_id := COALESCE(v_merchant_id, '00000000-0000-0000-0000-000000000000');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to all tables
DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_orders ON public.pos_orders;
CREATE TRIGGER tr_set_merchant_id_pos_orders BEFORE INSERT ON public.pos_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_menu_items ON public.pos_menu_items;
CREATE TRIGGER tr_set_merchant_id_pos_menu_items BEFORE INSERT ON public.pos_menu_items
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_menu_categories ON public.pos_menu_categories;
CREATE TRIGGER tr_set_merchant_id_pos_menu_categories BEFORE INSERT ON public.pos_menu_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_menu_modifiers ON public.pos_menu_modifiers;
CREATE TRIGGER tr_set_merchant_id_pos_menu_modifiers BEFORE INSERT ON public.pos_menu_modifiers
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_members ON public.pos_members;
CREATE TRIGGER tr_set_merchant_id_pos_members BEFORE INSERT ON public.pos_members
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_tables ON public.pos_tables;
CREATE TRIGGER tr_set_merchant_id_pos_tables BEFORE INSERT ON public.pos_tables
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_zones ON public.pos_zones;
CREATE TRIGGER tr_set_merchant_id_pos_zones BEFORE INSERT ON public.pos_zones
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_shifts ON public.pos_shifts;
CREATE TRIGGER tr_set_merchant_id_pos_shifts BEFORE INSERT ON public.pos_shifts
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_loyalty_coupons ON public.pos_loyalty_coupons;
CREATE TRIGGER tr_set_merchant_id_pos_loyalty_coupons BEFORE INSERT ON public.pos_loyalty_coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_member_coupons ON public.pos_member_coupons;
CREATE TRIGGER tr_set_merchant_id_pos_member_coupons BEFORE INSERT ON public.pos_member_coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_points_history ON public.pos_points_history;
CREATE TRIGGER tr_set_merchant_id_pos_points_history BEFORE INSERT ON public.pos_points_history
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_pos_qr_reward_tokens ON public.pos_qr_reward_tokens;
CREATE TRIGGER tr_set_merchant_id_pos_qr_reward_tokens BEFORE INSERT ON public.pos_qr_reward_tokens
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

DROP TRIGGER IF EXISTS tr_set_merchant_id_branches ON public.branches;
CREATE TRIGGER tr_set_merchant_id_branches BEFORE INSERT ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.set_merchant_id_on_insert();

-- 6. Enforce RLS policies for authenticated POS staff
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_orders_tenant_isolation ON public.pos_orders;
CREATE POLICY pos_orders_tenant_isolation ON public.pos_orders
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_menu_items_tenant_isolation ON public.pos_menu_items;
CREATE POLICY pos_menu_items_tenant_isolation ON public.pos_menu_items
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_menu_categories_tenant_isolation ON public.pos_menu_categories;
CREATE POLICY pos_menu_categories_tenant_isolation ON public.pos_menu_categories
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_menu_modifiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_menu_modifiers_tenant_isolation ON public.pos_menu_modifiers;
CREATE POLICY pos_menu_modifiers_tenant_isolation ON public.pos_menu_modifiers
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_members_tenant_isolation ON public.pos_members;
CREATE POLICY pos_members_tenant_isolation ON public.pos_members
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_tables_tenant_isolation ON public.pos_tables;
CREATE POLICY pos_tables_tenant_isolation ON public.pos_tables
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_zones_tenant_isolation ON public.pos_zones;
CREATE POLICY pos_zones_tenant_isolation ON public.pos_zones
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_shifts_tenant_isolation ON public.pos_shifts;
CREATE POLICY pos_shifts_tenant_isolation ON public.pos_shifts
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_loyalty_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_loyalty_coupons_tenant_isolation ON public.pos_loyalty_coupons;
CREATE POLICY pos_loyalty_coupons_tenant_isolation ON public.pos_loyalty_coupons
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_member_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_member_coupons_tenant_isolation ON public.pos_member_coupons;
CREATE POLICY pos_member_coupons_tenant_isolation ON public.pos_member_coupons
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_points_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_points_history_tenant_isolation ON public.pos_points_history;
CREATE POLICY pos_points_history_tenant_isolation ON public.pos_points_history
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

-- Enforce RLS on child relation tables through pos_orders
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_order_items_tenant_isolation ON public.pos_order_items;
CREATE POLICY pos_order_items_tenant_isolation ON public.pos_order_items
    FOR ALL
    TO authenticated
    USING (order_id IN (SELECT id FROM public.pos_orders WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())))
    WITH CHECK (order_id IN (SELECT id FROM public.pos_orders WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())));

ALTER TABLE public.pos_order_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_order_payments_tenant_isolation ON public.pos_order_payments;
CREATE POLICY pos_order_payments_tenant_isolation ON public.pos_order_payments
    FOR ALL
    TO authenticated
    USING (order_id IN (SELECT id FROM public.pos_orders WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())))
    WITH CHECK (order_id IN (SELECT id FROM public.pos_orders WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())));

-- Enforce RLS on branches and shop settings
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branches_tenant_isolation ON public.branches;
CREATE POLICY branches_tenant_isolation ON public.branches
    FOR ALL
    TO authenticated
    USING (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.pos_shop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_shop_settings_tenant_isolation ON public.pos_shop_settings;
CREATE POLICY pos_shop_settings_tenant_isolation ON public.pos_shop_settings
    FOR ALL
    TO authenticated
    USING (branch_id IN (SELECT id FROM public.branches WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())))
    WITH CHECK (branch_id IN (SELECT id FROM public.branches WHERE merchant_id = (SELECT merchant_id FROM public.profiles WHERE id = auth.uid())));

COMMIT;
