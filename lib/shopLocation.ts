import { supabase } from '@/lib/supabaseClient';
import { calculateDistance } from '@/lib/geoUtils';

export interface ShopLocationCheckResult {
  isAllowed: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  errorMessage?: string;
}

/**
 * Get current user GPS location using Browser Geolocation API
 */
export function getUserCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่งพิกัด GPS'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = 'ไม่สามารถระบุตำแหน่งพิกัด GPS ได้';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'กรุณาเปิดการเข้าถึงตำแหน่งที่ตั้ง (GPS) ในการตั้งค่าเบราว์เซอร์หรือมือถือ เพื่อยืนยันตำแหน่ง ณ ร้านค้าในการกดใช้คูปอง';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'สัญญาณ GPS ขัดข้อง ไม่สามารถระบุพิกัดตำแหน่งในขณะนี้';
        } else if (error.code === error.TIMEOUT) {
          msg = 'หมดเวลาค้นหาสัญญาณ GPS กรุณาลองใหม่อีกครั้ง';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

/**
 * Checks if a given coordinate is within the shop's allowed geolocation radius.
 */
export async function verifyUserIsAtShopLocation(
  userLat: number,
  userLng: number,
  branchId?: string | null
): Promise<ShopLocationCheckResult> {
  try {
    let query = supabase
      .from('pos_shop_settings')
      .select('latitude, longitude, check_in_radius, coupon_radius_meters');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: settings } = await query
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let shopLat = Number(settings?.latitude);
    let shopLng = Number(settings?.longitude);
    let allowedRadius = Number(settings?.coupon_radius_meters) || Number(settings?.check_in_radius) || 500;

    // Fallback query to branches if pos_shop_settings does not have lat/lng
    if (!shopLat || !shopLng) {
      const { data: branch } = await supabase
        .from('branches')
        .select('latitude, longitude')
        .limit(1)
        .maybeSingle();

      shopLat = Number(branch?.latitude) || 13.7563;
      shopLng = Number(branch?.longitude) || 100.5018;
    }

    const distanceMeters = Math.round(calculateDistance(userLat, userLng, shopLat, shopLng) * 1000);

    if (distanceMeters > allowedRadius) {
      return {
        isAllowed: false,
        distanceMeters,
        allowedRadiusMeters: allowedRadius,
        errorMessage: `คุณอยู่นอกพื้นที่ร้าน! การกดใช้คูปองนี้จำเป็นต้องกด ณ ตำแหน่งร้านเท่านั้น (ระยะห่างปัจจุบันของคุณ: ${distanceMeters.toLocaleString()} เมตร / รัศมีที่อนุญาต: ${allowedRadius.toLocaleString()} เมตร)`
      };
    }

    return {
      isAllowed: true,
      distanceMeters,
      allowedRadiusMeters: allowedRadius
    };
  } catch (err: any) {
    console.error('Error verifying shop location:', err);
    return {
      isAllowed: true, // Allow fallback if DB check encounters an unexpected issue
      distanceMeters: 0,
      allowedRadiusMeters: 500
    };
  }
}
