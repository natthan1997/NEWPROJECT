CREATE OR REPLACE FUNCTION pos_checkout_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id uuid;
    v_table_id uuid;
    v_order_action text;
    v_item jsonb;
    v_mov jsonb;
    v_pay jsonb;
    v_hist jsonb;
BEGIN
    v_order_action := payload->>'order_action';
    
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
            delivery_platform, delivery_gp_amount, reference_name, promo_code
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
            payload->'order'->>'promo_code'
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
            promo_code = payload->'order'->>'promo_code'
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
                INSERT INTO pos_points_history (member_id, order_id, points, points_change, type, description)
                VALUES (
                    (payload->>'member_id')::uuid,
                    v_order_id,
                    COALESCE((v_hist->>'points')::int, 0),
                    COALESCE((v_hist->>'points_change')::int, 0),
                    v_hist->>'type',
                    v_hist->>'description'
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
