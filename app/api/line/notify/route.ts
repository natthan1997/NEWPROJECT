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
    
    // If "to" is missing and it's an inventory alert, Z-report, etc., fetch admins/managers server-side
    let targets: string[] = to ? (Array.isArray(to) ? to : [to]) : []
    
    if (targets.length === 0 && (type === 'inventory' || type === 'inventory_audit' || type === 'checkout_photos' || type === 'z_report')) {
      console.log('[LINE Notify] Auto-fetching admins/managers for notification type:', type);

      // Fetch shop settings to check dynamic role permissions & manager line id
      const { data: settingsData } = await supabase
        .from('pos_shop_settings')
        .select('role_permissions, opening_hours')
        .limit(1)
        .maybeSingle();

      const rolePermissions = settingsData?.role_permissions || {};

      // Check direct manager line ID in shop settings
      if (settingsData?.opening_hours?.manager_line_id) {
        targets.push(settingsData.opening_hours.manager_line_id);
      }
      if (settingsData?.opening_hours?.manager_line_user_id) {
        targets.push(settingsData.opening_hours.manager_line_user_id);
      }

      // Fetch profiles to get roles & line_user_id
      const { data: profiles } = await supabase.from('profiles').select('id, role, staff_level, line_user_id, email');

      // Fetch pos_members to check line_user_id mapping
      const { data: posMembers } = await supabase.from('pos_members').select('id, user_id, email, phone, line_user_id').not('line_user_id', 'is', null);

      // 1. Fetch all users from Auth to get their metadata (where line_user_id lives)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (!authError && authData?.users) {
        authData.users.forEach(user => {
          const profile = profiles?.find(p => p.id === user.id);
          const role = String(profile?.role || '').toLowerCase();
          const level = String(profile?.staff_level || '').toLowerCase();
          const userEmail = String(user.email || '').toLowerCase();
          
          let requiredPermission = '';
          if (type === 'inventory') requiredPermission = 'line-notify-inventory';
          else if (type === 'inventory_audit') requiredPermission = 'line-notify-inventory-audit';
          else if (type === 'checkout_photos') requiredPermission = 'line-notify-checkout-photos';
          else if (type === 'z_report') requiredPermission = 'line-notify-zreport';

          // Owners, Admins, and Managers get notifications by default
          let hasPermission = 
            role.includes('owner') || 
            role.includes('super') || 
            role.includes('admin') || 
            role.includes('manager') || 
            level.includes('manager') || 
            level.includes('admin') ||
            level.includes('owner');

          if (!hasPermission && requiredPermission) {
             const userPermissions = rolePermissions[level] || [];
             hasPermission = userPermissions.includes(requiredPermission);
          }

          let lineId = user.user_metadata?.line_user_id || (user.user_metadata as any)?.lineUserId || profile?.line_user_id;

          if (!lineId && userEmail) {
            const memberMatch = posMembers?.find(m => m.user_id === user.id || (m.email && m.email.toLowerCase() === userEmail));
            if (memberMatch?.line_user_id) {
              lineId = memberMatch.line_user_id;
            }
          }

          if (hasPermission && lineId && !targets.includes(lineId)) {
            targets.push(lineId);
          }
        });
      }

      // Fallback: check profiles directly for any managers/admins with line_user_id set
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          const role = String(p.role || '').toLowerCase();
          const level = String(p.staff_level || '').toLowerCase();
          const isManagerOrAdmin = 
            role.includes('owner') || 
            role.includes('super') || 
            role.includes('admin') || 
            role.includes('manager') || 
            level.includes('manager') || 
            level.includes('admin');
            
          if (isManagerOrAdmin && p.line_user_id && !targets.includes(p.line_user_id)) {
            targets.push(p.line_user_id);
          }
        });
      }
    }
    
    // Log the attempt to audit_logs for the admin dashboard
    await supabase.from('audit_logs').insert({
        action: type === 'inventory' ? 'inventory_low_stock_notification' : type === 'inventory_audit' ? 'inventory_audit_summary' : type === 'z_report' ? 'z_report_line_notification' : 'line_notification_send',
        details: {
            type,
            targetCount: targets.length,
            itemsCount: items?.length || 0,
            targets: targets,
            status: targets.length > 0 ? 'attempting' : 'failed_no_targets'
        }
    });

    if (targets.length === 0) {
      console.warn('[LINE Notify] No targets found for notification type:', type)
      return NextResponse.json({ success: true, sent: 0, error: 'No linked managers/admins found' })
    }

    let successCount = 0;
    let errors: string[] = [];

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
