import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLineNotification, sendLineFlexNotification, sendInventoryAlertFlex, sendInventoryAuditFlex, sendCheckoutPhotosFlex, sendZReportFlex } from '@/lib/line'

function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, message, type, orderData, items } = body
    
    const supabase = createSupabaseServiceClient()
    
    // If "to" is missing and it's an inventory alert, we fetch admins server-side
    let targets = to ? (Array.isArray(to) ? to : [to]) : []
    
    if (targets.length === 0 && (type === 'inventory' || type === 'inventory_audit' || type === 'checkout_photos' || type === 'z_report')) {
      console.log('[LINE Notify] Auto-fetching admins from Auth metadata...');
      
      // 1. Fetch all users from Auth to get their metadata (where line_user_id lives)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (!authError && authData) {
        // Fetch shop settings to check dynamic role permissions
        const { data: settingsData } = await supabase
          .from('pos_shop_settings')
          .select('role_permissions')
          .limit(1)
          .single();
        
        const rolePermissions = settingsData?.role_permissions || {};

        // Fetch profiles to get the staff_level (custom role id)
        const { data: profiles } = await supabase.from('profiles').select('id, role, staff_level');

        authData.users.forEach(user => {
          const profile = profiles?.find(p => p.id === user.id);
          const role = String(profile?.role || '').toLowerCase();
          const level = String(profile?.staff_level || '').toLowerCase();
          
          let requiredPermission = '';
          if (type === 'inventory') requiredPermission = 'line-notify-inventory';
          else if (type === 'inventory_audit') requiredPermission = 'line-notify-inventory-audit';
          else if (type === 'checkout_photos') requiredPermission = 'line-notify-checkout-photos';
          else if (type === 'z_report') requiredPermission = 'line-notify-zreport';

          // Owners and Superadmins get everything by default
          let hasPermission = role.includes('owner') || role.includes('super');
          
          if (!hasPermission && requiredPermission) {
             const userPermissions = rolePermissions[level] || [];
             hasPermission = userPermissions.includes(requiredPermission);
          } else if (!hasPermission) {
             // Fallback for any other type without a specific permission
             hasPermission = role.includes('admin') || level.includes('manager') || level.includes('admin');
          }

          const lineId = user.user_metadata?.line_user_id;

          if (hasPermission && lineId) {
            targets.push(lineId);
          }
        });
      }
    }
    
    // Log the attempt to audit_logs for the admin dashboard
    await supabase.from('audit_logs').insert({
        action: type === 'inventory' ? 'inventory_low_stock_notification' : type === 'inventory_audit' ? 'inventory_audit_summary' : 'line_notification_send',
        details: {
            type,
            targetCount: targets.length,
            itemsCount: items?.length || 0,
            targets: targets,
            status: targets.length > 0 ? 'attempting' : 'failed_no_targets'
        }
    });

    if (targets.length === 0) {
      return NextResponse.json({ success: true, sent: 0, error: 'No linked admins found' })
    }

    let successCount = 0;
    let errors = [];

    if (type === 'flex' && orderData) {
      for (const target of targets) {
        try {
          await sendLineFlexNotification(target, { ...orderData, silent: orderData.silent })
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    } else if (type === 'inventory' && items) {
      for (const target of targets) {
        try {
          await sendInventoryAlertFlex(target, { items })
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    } else if (type === 'inventory_audit' && body.auditData) {
      for (const target of targets) {
        try {
          await sendInventoryAuditFlex(target, body.auditData)
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    } else if (type === 'checkout_photos' && body.photoData) {
      for (const target of targets) {
        try {
          await sendCheckoutPhotosFlex(target, body.photoData)
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    } else if (type === 'z_report' && body.reportData) {
      for (const target of targets) {
        try {
          await sendZReportFlex(target, body.reportData)
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    } else {
      for (const target of targets) {
        try {
          await sendLineNotification(target, message)
          successCount++;
        } catch (e: any) { errors.push(e.message); }
      }
    }

    // Update audit log with final result
    if (errors.length > 0) {
        await supabase.from('audit_logs').insert({
            action: 'line_notification_delivery_failed',
            details: { type, errors, successCount, total: targets.length }
        });
    }

    return NextResponse.json({ success: true, sent: successCount, total: targets.length, errors })
  } catch (err: any) {
    console.error('Notification API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
