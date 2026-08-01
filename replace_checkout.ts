import fs from 'fs';

const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStartStr = `if (editingOrderId) {
	        const orderUpdatePayload: any = {`;
const targetEndStr = `await supabase.from('pos_tables').update({ parent_table_id: null }).eq('parent_table_id', selectedTable.id)
          fetchTables()
        } catch (tableErr) {
          console.error('Failed to update table status:', tableErr)
        }
      }`;

const startIndex = content.indexOf(targetStartStr);
const endIndex = content.indexOf(targetEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find targets");
  process.exit(1);
}

const replacement = `const payload: any = {
        order_action: editingOrderId ? 'update' : 'insert',
        order_id: editingOrderId || undefined,
        order: {
          order_number: finalOrderNumber,
          staff_id: profile?.id,
          shift_id: activeShift?.id,
          branch_id: activeShift?.branch_id || shopSettings?.branch_id || null,
          status: newStatus,
          total_amount: rawCartSubTotal,
          net_total: cartTotal,
          tax_amount: vatAmount,
          service_charge_amount: serviceChargeAmount,
          discount_amount: discountTotalValue + itemDiscountTotal,
          customer_id: selectedCustomer?.id,
          order_type: orderType,
          table_id: selectedTable?.id,
          table_number: selectedTable?.table_number,
          queue_number: finalQueueNumber,
          payment_method: method,
          order_source: 'pos',
          paid_at: new Date().toISOString(),
          delivery_platform: orderType === 'delivery' ? deliveryPlatform : null,
          delivery_gp_amount: deliveryGpAmount,
          reference_name: orderType === 'delivery' && platformOrderId ? platformOrderId.trim() : null,
        },
        order_items: cart.map(item => {
          const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
          return {
            item_id: item.id,
            quantity: item.quantity,
            unit_price: getEffectiveItemUnitPrice(item),
            cost_price: item.cost_price || 0,
            subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
            selected_modifiers: item.selected_modifiers,
            customer_name: item.customer_name || 'ลูกค้า',
            discount_amount: item.discount_amount || 0,
            discount_reason: item.discount_reason || null,
          }
        }),
        payments: [{
          payment_method: method,
          amount: amountToPay,
          status: 'paid'
        }]
      };

      try {
        const movementsToInsert: any[] = []
        for (const item of cart) {
          const selectedMods = item.selected_modifiers || []
          
          // Phase 1: Context Extraction from selected modifiers
          let sweetnessRatio = 1.0
          let activeRoastIngredientId: string | null = null
          const substitutionsMap = new Map<string, { newIngredientId: string, name: string }>()

          selectedMods.forEach((mod: any) => {
            // Sweetness ratio extraction
            if (mod.sweetness_multiplier !== undefined && mod.sweetness_multiplier !== null) {
              sweetnessRatio = Number(mod.sweetness_multiplier)
            } else if (mod.name) {
              if (mod.name.includes('0%')) sweetnessRatio = 0.0
              else if (mod.name.includes('25%')) sweetnessRatio = 0.25
              else if (mod.name.includes('50%')) sweetnessRatio = 0.50
              else if (mod.name.includes('125%')) sweetnessRatio = 1.25
            }

            // Recipe ingredients inside modifier
            const modRecipes = mod.recipe_data || []
            modRecipes.forEach((ing: any) => {
              // Active roast bean extraction
              if (mod.name && (mod.name.includes('คั่ว') || mod.name.includes('Roast')) && ing.ingredient_id) {
                activeRoastIngredientId = ing.ingredient_id
              }
              // Substitution mapping
              if (ing.is_substitution || mod.is_substitution || (mod.name && (mod.name.includes('Almond') || mod.name.includes('Oat') || mod.name.includes('อัลมอนด์')))) {
                const targetName = ing.substitute_target_name || 'นมสด'
                substitutionsMap.set(targetName, { newIngredientId: ing.ingredient_id, name: ing.name })
              }
            })
          })

          // Phase 2: Base Menu Recipe Deduction
          let reducedSweetenerVolume = 0
          let baseLiquidIngIndex = -1
          const baseIngredientsToDeduct: { ingredient_id: string, quantity: number, factor: number }[] = []

          if (item.recipe_data && Array.isArray(item.recipe_data)) {
            item.recipe_data.forEach((ing: any, idx: number) => {
              if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) return;

              let baseQty = Number(ing.quantity || 0)
              const factor = Number(ing.factor || 1)

              const isSweetener = ing.is_sweetener || (ing.name && (ing.name.includes('น้ำเชื่อม') || ing.name.includes('นมข้น') || ing.name.includes('ไซรัป') || ing.name.includes('Syrup')))
              const isBaseLiquid = ing.is_base_liquid || (ing.name && (ing.name.includes('ชา') || ing.name.includes('กาแฟ') || ing.name.includes('Coffee') || ing.name.includes('Tea')))

              if (isSweetener) {
                const scaledQty = baseQty * sweetnessRatio
                reducedSweetenerVolume += (baseQty - scaledQty) * factor
                baseQty = scaledQty
              } else if (isBaseLiquid && baseLiquidIngIndex === -1) {
                baseLiquidIngIndex = idx
              }

              // Check if substituted by modifier (e.g. Milk -> Almond Milk)
              let targetId = ing.ingredient_id
              substitutionsMap.forEach((sub, key) => {
                if (ing.name && ing.name.includes(key)) {
                  targetId = sub.newIngredientId
                }
              })

              if (targetId && baseQty > 0) {
                baseIngredientsToDeduct.push({ ingredient_id: targetId, quantity: baseQty, factor })
              }
            })

            // Apply base liquid compensation if sweetener volume was reduced
            if (reducedSweetenerVolume > 0 && baseLiquidIngIndex !== -1 && item.recipe_data[baseLiquidIngIndex]) {
              const baseIng = item.recipe_data[baseLiquidIngIndex]
              const baseFactor = Number(baseIng.factor || 1)
              const topUpQty = reducedSweetenerVolume / (baseFactor || 1)
              
              const existingDeduct = baseIngredientsToDeduct.find(b => b.ingredient_id === baseIng.ingredient_id)
              if (existingDeduct) {
                existingDeduct.quantity += topUpQty
              }
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            for (const bIng of baseIngredientsToDeduct) {
              const usage = bIng.quantity * bIng.factor * Number(item.quantity)
              if (bIng.ingredient_id && uuidRegex.test(bIng.ingredient_id) && usage > 0) {
                const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', bIng.ingredient_id).maybeSingle()
                movementsToInsert.push({
                  item_id: bIng.ingredient_id,
                  change_amount: -usage,
                  new_quantity: invItem ? Number(invItem.stock_quantity) : 0,
                  reason: 'sale'
                })
              }
            }
          }

          // Phase 3: Extra Modifier Recipe Deduction
          if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
            for (const mod of item.selected_modifiers) {
              if (mod.recipe_data && Array.isArray(mod.recipe_data)) {
                for (const ing of mod.recipe_data) {
                  if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) continue;
                  
                  // Skip if it was already processed as a substitution in Phase 2
                  if (ing.is_substitution) continue;

                  let targetIngId = ing.ingredient_id
                  // Contextual roast inheritance for extra shot
                  if ((ing.is_contextual_roast || (mod.name && mod.name.includes('Shot'))) && activeRoastIngredientId) {
                    targetIngId = activeRoastIngredientId
                  }

                  const usage = Number(ing.quantity || 0) * Number(ing.factor || 1) * Number(item.quantity)
                  if (targetIngId && uuidRegex.test(targetIngId) && usage > 0) {
                    const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', targetIngId).maybeSingle()
                    movementsToInsert.push({
                      item_id: targetIngId,
                      change_amount: -usage,
                      new_quantity: invItem ? Number(invItem.stock_quantity) : 0,
                      reason: 'sale'
                    })
                  }
                }
              }
            }
          }
        }
        if (movementsToInsert.length > 0) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          payload.movements = movementsToInsert.filter(m => m.item_id && uuidRegex.test(m.item_id));
        }
      } catch (movErr) {
        console.error('Failed to prepare inventory movements:', movErr)
      }

      if (selectedCustomer?.id) {
        payload.member_id = selectedCustomer.id;
        payload.points_history = [];
        
        if (redeemPointsAmount && parseInt(redeemPointsAmount) > 0) {
          const pts = parseInt(redeemPointsAmount);
          payload.points_to_deduct = pts;
          payload.points_history.push({
            points: -pts,
            points_change: -pts,
            type: 'redeem',
            description: \`Redeemed \${pts} pts for POS Order #\${finalOrderNumber}\`
          });
        }
        
        if (appliedCouponId) {
          payload.coupon_id_to_mark_used = appliedCouponId;
        }

        const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined ? shopSettings.opening_hours.loyalty_earn_thb : (shopSettings?.opening_hours?.loyalty_earn_rate || 100);
        const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined ? shopSettings.opening_hours.loyalty_earn_pts : 1;
        
        let pointableAmount = amountToPay;
        let pointsEarned = 0;
        
        if (pointableAmount > 0 && earnThb > 0) {
          if (activeCampaigns && activeCampaigns.length > 0 && cart.length > 0) {
            let totalMultiplierEffectiveAmount = 0;
            const ratio = amountToPay / (cartTotal || 1);
            
            cart.forEach((item: any) => {
              const itemEffectivePrice = ((item.price || 0) * (item.quantity || 1)) * ratio;
              let multiplier = 1.0;
              const catName = item.category?.name || '';
              
              activeCampaigns.forEach(camp => {
                if (camp.applicable_categories && camp.applicable_categories.length > 0) {
                  const match = camp.applicable_categories.find((c: string) => c.toLowerCase() === catName.toLowerCase());
                  if (match) multiplier = Math.max(multiplier, camp.multiplier);
                } else {
                   multiplier = Math.max(multiplier, camp.multiplier);
                }
              });
              totalMultiplierEffectiveAmount += (itemEffectivePrice * multiplier);
            });
            pointsEarned = Math.floor(totalMultiplierEffectiveAmount / earnThb) * earnPts;
          } else {
            pointsEarned = Math.floor(amountToPay / earnThb) * earnPts;
          }
        }
        
        if (pointsEarned > 0) {
          payload.points_earned = pointsEarned;
          payload.points_history.push({
            points: pointsEarned,
            points_change: pointsEarned,
            type: 'earn',
            description: \`Earned from POS Order #\${finalOrderNumber}\`
          });
        }
      }

      if (newStatus === 'completed' && selectedTable?.id) {
        payload.table_id_to_clear = selectedTable.id;
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc('pos_checkout_order', { payload });
      
      if (rpcError) {
        console.error('RPC Checkout Error:', rpcError);
        throw rpcError;
      }

      finalOrderId = rpcResult?.order_id || editingOrderId;

      if (newStatus === 'completed' && selectedTable?.id) {
        fetchTables();
      }`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + targetEndStr.length);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Replacement complete");
