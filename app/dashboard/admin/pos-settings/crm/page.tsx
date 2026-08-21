'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Plus, Trash2, Tag, Gift, Zap, Edit2, CheckCircle2, Award, AlertTriangle, Upload, X, Image, History } from 'lucide-react';

export default function LoyaltySettingsPage() {
  const [activeTab, setActiveTab] = useState<'tiers' | 'titles' | 'coupons' | 'campaigns' | 'marketing'>('tiers');
  const [tiers, setTiers] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Marketing / CRM automation states
  const [segmentsSummary, setSegmentsSummary] = useState<any>({ total: 0, loyal: 0, churn: 0, inactive: 0, general: 0 });
  const [allSegmentMembers, setAllSegmentMembers] = useState<any[]>([]);
  const [selectedSegmentDetail, setSelectedSegmentDetail] = useState<string | null>(null);
  const [broadcastSegment, setBroadcastSegment] = useState<string>('churn');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('สวัสดีครับคุณ {name} ทางร้าน RUSH UP คิดถึงคุณจังเลย! ขอมอบของขวัญพิเศษเป็นคูปองส่วนลดสำหรับสั่งซื้อครั้งถัดไปนะครับ เปิดแอป LINE เพื่อกดดูคูปองได้เลยครับ');
  const [broadcastCouponId, setBroadcastCouponId] = useState<string>('');
  const [broadcastSending, setBroadcastSending] = useState<boolean>(false);
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tr, t, c, camp, m, cat, segsRes, logsRes] = await Promise.all([
      supabase.from('pos_member_tiers').select('*').order('min_points', { ascending: true }),
      supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true }),
      supabase.from('pos_loyalty_coupons').select('*').order('cost_points', { ascending: true }),
      supabase.from('pos_loyalty_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('pos_menu_items').select('id, name').eq('is_active', true).order('name'),
      supabase.from('pos_menu_categories').select('id, name').order('name'),
      fetch('/api/admin/crm/segments').then(r => r.json()).catch(() => ({ success: false })),
      supabase.from('audit_logs').select('*').eq('action', 'crm_targeted_line_broadcast').order('created_at', { ascending: false }).limit(10)
    ]);
    if (tr.data) setTiers(tr.data);
    if (t.data) setTitles(t.data);
    if (c.data) setCoupons(c.data);
    if (camp.data) setCampaigns(camp.data);
    if (m.data) setMenuItems(m.data);
    if (cat.data) setCategories(cat.data);

    if (segsRes?.success) {
      setSegmentsSummary(segsRes.summary);
      setAllSegmentMembers(segsRes.members);
    }
    if (logsRes?.data) {
      setBroadcastLogs(logsRes.data);
    }
    setLoading(false);
  };

  const handleSaveTier = async (tier: any) => {
    const { id, ...data } = tier;
    
    // Parse benefits string back to array if it was edited as string
    let parsedBenefits = data.benefits;
    if (typeof parsedBenefits === 'string') {
      try { parsedBenefits = JSON.parse(parsedBenefits); }
      catch(e) { parsedBenefits = parsedBenefits.split(',').map((s:string) => s.trim()).filter((s:string) => s); }
    }
    
    try {
      const res = await fetch('/api/admin/crm/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data, benefits: parsedBenefits })
      });
      const result = await res.json();
      if (!result.success) {
        alert('Save Error: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Save Error: ' + e.message);
    }
    loadData();
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    try {
      const res = await fetch('/api/admin/crm/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const result = await res.json();
      if (!result.success) {
        alert('Delete Error: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Delete Error: ' + e.message);
    }
    setTiers(tiers.filter(t => t.id !== id));
    loadData();
  };

  const handleSaveTitle = async (title: any) => { console.log('Saving title:', title);
    const { id, ...data } = title;
    if (id.startsWith('new-')) {
      const { error } = await supabase.from('pos_loyalty_titles').insert([data]);
      if(error) alert('Insert Error: ' + error.message);
    } else {
      const { error } = await supabase.from('pos_loyalty_titles').update(data).eq('id', id);
      if(error) alert('Update Error: ' + error.message);
    }
    loadData();
  };

  const handleDeleteTitle = async (id: string) => {
    if (!id.startsWith('new-')) {
      await supabase.from('pos_loyalty_titles').delete().eq('id', id);
    }
    setTitles(titles.filter(t => t.id !== id));
  };

  const handleSaveCoupon = async (coupon: any) => {
    const { id, ...data } = coupon;
    let res;
    if (id.startsWith('new-')) {
      res = await supabase.from('pos_loyalty_coupons').insert([{ ...data, is_gacha_only: data.is_gacha_only || false, is_applicable_delivery: data.is_applicable_delivery ?? true, is_birthday_only: data.is_birthday_only || false }]);
    } else {
      res = await supabase.from('pos_loyalty_coupons').update({ ...data, is_gacha_only: data.is_gacha_only || false, is_applicable_delivery: data.is_applicable_delivery ?? true, is_birthday_only: data.is_birthday_only || false }).eq('id', id);
    }
    
    if (res.error) {
      console.error('Error saving coupon:', res.error);
      alert('Error saving coupon: ' + res.error.message);
    } else {
      alert('บันทึกคูปองสำเร็จ');
    }
    
    loadData();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!id.startsWith('new-')) {
      await supabase.from('pos_loyalty_coupons').delete().eq('id', id);
    }
    setCoupons(coupons.filter(c => c.id !== id));
  };

  const [uploadingCouponId, setUploadingCouponId] = useState<string | null>(null);

  const handleUploadCouponImage = async (couponId: string, file: File) => {
    setUploadingCouponId(couponId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'images');
      formData.append('path', `coupons/coupon_${Date.now()}.${file.name.split('.').pop() || 'png'}`);

      const res = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (!res.ok || !result.publicUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, image_url: result.publicUrl } : c));
    } catch (err: any) {
      console.error('Error uploading coupon image:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingCouponId(null);
    }
  };

  
  const handleSaveCampaign = async (campaign: any) => {
    if (!campaign.name) return alert('กรุณากรอกชื่อแคมเปญ');
    
    // Ensure applicable_categories is parsed as array if it's string
    let parsedCategories = campaign.applicable_categories;
    if (typeof parsedCategories === 'string') {
      parsedCategories = parsedCategories.split(',').map(s => s.trim()).filter(s => s);
    }
    
    const { error } = campaign.id.startsWith('new-')
      ? await supabase.from('pos_loyalty_campaigns').insert([{ 
          name: campaign.name, 
          multiplier: campaign.multiplier, 
          applicable_categories: parsedCategories, 
          is_active: campaign.is_active 
        }])
      : await supabase.from('pos_loyalty_campaigns').update({ 
          name: campaign.name, 
          multiplier: campaign.multiplier, 
          applicable_categories: parsedCategories, 
          is_active: campaign.is_active 
        }).eq('id', campaign.id);
        
    if (error) alert('Error: ' + error.message);
    else {
      alert('บันทึกสำเร็จ');
      loadData();
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    if (!id.startsWith('new-')) {
      const { error } = await supabase.from('pos_loyalty_campaigns').delete().eq('id', id);
      if (error) return alert('Error: ' + error.message);
    }
    loadData();
  };

  const handleManualReset = async () => {
    const confirmation = window.prompt("⚠️ พิมพ์คำว่า 'RESET' เพื่อยืนยันการล้างแต้มและประเมินรักษาสิทธิ์รายปี (ระวัง: ข้อมูลนี้ไม่สามารถกู้คืนได้)");
    if (confirmation === 'RESET') {
      try {
        const { error } = await supabase.rpc('reset_annual_loyalty');
        if (error) throw error;
        alert('✅ ล้างแต้มและรักษาสิทธิ์ประจำปีสำเร็จ');
      } catch (err: any) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  };

  const renderTiers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-100">
        <div>
          <h2 className="text-lg font-bold text-amber-900">ระดับสมาชิก (Member Tiers)</h2>
          <p className="text-sm text-amber-700">จัดการระดับสมาชิก ส่วนลดเปอร์เซ็นต์ และตัวคูณคะแนน</p>
        </div>
        <button 
          onClick={() => setTiers([...tiers, { id: 'new-' + Date.now(), name: 'New Tier', min_points: 1000, multiplier: 1.0, discount_rate: 0, bg_hex: '#ffffff', text_hex: '#000000', bar_hex: '#3b82f6', benefits: '[]' }])}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มระดับสมาชิก
        </button>
      </div>

      {tiers.map(tier => (
        <div key={tier.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" style={{ color: tier.bar_hex || '#000' }} />
              <input 
                type="color" 
                value={tier.bg_hex || '#ffffff'} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, bg_hex: e.target.value } : t))}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Background Color"
              />
              <input 
                type="color" 
                value={tier.text_hex || '#000000'} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, text_hex: e.target.value } : t))}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Text Color"
              />
              <input 
                type="color" 
                value={tier.bar_hex || '#000000'} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, bar_hex: e.target.value } : t))}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200" title="Badge/Bar Color"
              />
              <input 
                type="text" 
                value={tier.name} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, name: e.target.value } : t))}
                placeholder="ชื่อระดับ เช่น Gold" 
                className="font-bold text-lg border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleSaveTier(tier)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Save className="w-5 h-5" />
              </button>
              <button onClick={() => handleDeleteTier(tier.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">คะแนนสะสมขั้นต่ำ</label>
              <input 
                type="number" 
                value={tier.min_points} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, min_points: parseInt(e.target.value) } : t))}
                className="w-full border-gray-300 rounded-md text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">ตัวคูณแต้ม (Multiplier)</label>
              <input 
                type="number" step="0.1"
                value={tier.multiplier} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, multiplier: parseFloat(e.target.value) } : t))}
                className="w-full border-gray-300 rounded-md text-sm font-medium text-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">ส่วนลดอัตโนมัติ (%)</label>
              <input 
                type="number" step="0.1"
                value={tier.discount_rate || 0} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, discount_rate: parseFloat(e.target.value) } : t))}
                className="w-full border-gray-300 rounded-md text-sm font-medium text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">สิทธิประโยชน์ (JSON array หรือคั่นด้วยลูกน้ำ)</label>
              <input 
                type="text" 
                value={typeof tier.benefits === 'string' ? tier.benefits : JSON.stringify(tier.benefits || [])} 
                onChange={e => setTiers(tiers.map(t => t.id === tier.id ? { ...t, benefits: e.target.value } : t))}
                className="w-full border-gray-300 rounded-md text-sm text-gray-600"
                placeholder='["สิทธิ์ A", "สิทธิ์ B"]'
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTitles = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ฉายาลูกค้า (Dynamic Titles)</h2>
          <p className="text-sm text-gray-500">ระบบจะมอบฉายาให้ลูกค้าอัตโนมัติตามเงื่อนไขที่กำหนด</p>
        </div>
        <button 
          onClick={() => setTitles([...titles, { id: 'new-' + Date.now(), name: '', rule_type: 'total_visits', rule_threshold: 10, badge_color: '#4b5563' }])}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> เพิ่มฉายา
        </button>
      </div>

      {titles.map(title => (
        <div key={title.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
          <input 
            type="color" 
            value={title.badge_color} 
            onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, badge_color: e.target.value } : t))}
            className="w-10 h-10 rounded cursor-pointer" 
          />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่อฉายา</label>
              <input 
                type="text" 
                value={title.name} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, name: e.target.value } : t))}
                placeholder="เช่น อัศวินรัตติกาล" 
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประเภทเงื่อนไข</label>
              <select 
                value={title.rule_type} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, rule_type: e.target.value } : t))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="total_visits">จำนวนครั้งที่มาร้าน (รวม)</option>
                <option value="lifetime_spend">ยอดใช้จ่ายสะสมรวม</option>
                <option value="single_receipt_spend">ยอดเปย์หนักบิลเดียว (บาท)</option>
                <option value="party_buyer">สายเหมา (จำนวนแก้วต่อบิล)</option>
                <option value="same_menu_streak">แฟนพันธุ์แท้ (สุ่มสั่งเมนูเดิมซ้ำครบ X ครั้ง)</option>
                <option value="category_purchase">ซื้อหมวดหมู่เฉพาะ (ระบุหมวด)</option>
                <option value="specific_menu_purchase">ซื้อเมนูเฉพาะ (ระบุเมนู)</option>
                <option value="morning_visits">นกตื่นเช้า (มาก่อน 9 โมงครบ X ครั้ง)</option>
                <option value="evening_visits">สายดึก (มาหลัง 6 โมงเย็นครบ X ครั้ง)</option>
              </select>
            </div>
            
            {(title.rule_type === 'category_purchase' || title.rule_type === 'specific_menu_purchase') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">เป้าหมาย ({title.rule_type === 'category_purchase' ? 'เลือกหมวดหมู่' : 'เลือกเมนู'})</label>
                <select 
                  value={title.rule_target || ''} 
                  onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, rule_target: e.target.value } : t))}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- เลือก --</option>
                  {title.rule_type === 'category_purchase' && categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  {title.rule_type === 'specific_menu_purchase' && menuItems.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">คำอธิบาย (How to get)</label>
              <input 
                type="text" 
                value={title.description || ''} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, description: e.target.value } : t))}
                placeholder="เช่น มาซื้อตอนเช้าครบ 10 ครั้ง" 
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">สิทธิพิเศษ (Benefits)</label>
              <input 
                type="text" 
                value={title.benefits || ''} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, benefits: e.target.value } : t))}
                placeholder="เช่น ฟรี Americano 1 แก้ว" 
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">จำนวนที่ต้องถึง (Threshold)</label>
              <input 
                type="number" 
                value={title.rule_threshold} 
                onChange={e => setTitles(titles.map(t => t.id === title.id ? { ...t, rule_threshold: parseInt(e.target.value) } : t))}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <button onClick={() => handleSaveTitle(title)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Save">
            <Save className="w-5 h-5" />
          </button>
          <button onClick={() => handleDeleteTitle(title.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );

  const renderCoupons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">แม่แบบคูปอง (Redeemable Coupons)</h2>
          <p className="text-sm text-gray-500">คูปองที่ลูกค้าสามารถใช้แต้มแลกเพื่อเก็บไว้ใช้หน้าร้าน</p>
        </div>
        <button 
          onClick={() => setCoupons([...coupons, { id: 'new-' + Date.now(), name: '', cost_points: 500, discount_type: 'free_item', discount_value: 0, is_active: true }])}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> เพิ่มคูปอง
        </button>
      </div>

      {coupons.map(coupon => (
        <div key={coupon.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-purple-600" />
              <input 
                type="text" 
                value={coupon.name} 
                onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, name: e.target.value } : c))}
                placeholder="ชื่อคูปอง (เช่น ฟรีเครื่องดื่ม 1 แก้ว)" 
                className="font-medium text-lg border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  checked={coupon.is_active} 
                  onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: e.target.checked } : c))}
                  className="rounded text-blue-600" 
                /> เปิดใช้งาน
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 ml-2">
                <input 
                  type="checkbox" 
                  checked={coupon.is_gacha_only || false} 
                  onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_gacha_only: e.target.checked } : c))}
                  className="rounded text-purple-600" 
                /> เฉพาะกาชา
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 ml-2">
                <input 
                  type="checkbox" 
                  checked={coupon.is_applicable_delivery ?? true} 
                  onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_applicable_delivery: e.target.checked } : c))}
                  className="rounded text-blue-600" 
                /> ใช้กับเดลิเวอรี่ได้
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 ml-2">
                <input 
                  type="checkbox" 
                  checked={coupon.is_birthday_only || false} 
                  onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_birthday_only: e.target.checked } : c))}
                  className="rounded text-pink-500" 
                /> คูปองเดือนเกิด
              </label>
              <button onClick={() => handleSaveCoupon(coupon)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Save className="w-5 h-5" />
              </button>
              <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ใช้แต้มแลก (Points required)</label>
                  <input 
                    type="number" 
                    value={coupon.cost_points} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, cost_points: parseInt(e.target.value) } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ประเภทส่วนลด</label>
                  <select 
                    value={coupon.discount_type} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, discount_type: e.target.value } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                  >
                    <option value="free_item">ฟรี 1 รายการ</option>
                    <option value="percent">ส่วนลด %</option>
                    <option value="fixed">ส่วนลดบาท</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {coupon.discount_type === 'free_item' ? 'ไม่ใช้งาน (เว้นว่าง)' : 'มูลค่า (Value)'}
                  </label>
                  <input 
                    type="number" 
                    value={coupon.discount_value || 0} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, discount_value: parseFloat(e.target.value) } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ยอดสั่งซื้อขั้นต่ำ (Min Order Amount)</label>
                  <input 
                    type="number" 
                    value={coupon.min_order_amount || 0} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, min_order_amount: parseFloat(e.target.value) } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                    placeholder="0 = ไม่มีขั้นต่ำ"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ลดสูงสุด / ฟรีสูงสุด (Max Discount)</label>
                  <input 
                    type="number" 
                    value={coupon.max_discount_amount || ''} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                    placeholder="เว้นว่าง = ไม่จำกัด"
                  />
                </div>
              </div>

              {/* Inclusions and Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-2">หมวดหมู่ที่ใช้ได้ (Applicable Categories)</label>
                  <div className="h-32 overflow-y-auto border border-gray-200 rounded-md bg-white p-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 text-xs py-1">
                        <input 
                          type="checkbox" 
                          checked={(coupon.applicable_categories || []).includes(cat.id)}
                          onChange={e => {
                            const current = coupon.applicable_categories || [];
                            const updated = e.target.checked ? [...current, cat.id] : current.filter((id: string) => id !== cat.id);
                            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, applicable_categories: updated } : c));
                          }}
                        /> {cat.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-2">หมวดหมู่ที่ยกเว้น (Excluded Categories)</label>
                  <div className="h-32 overflow-y-auto border border-gray-200 rounded-md bg-white p-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 text-xs py-1">
                        <input 
                          type="checkbox" 
                          checked={(coupon.excluded_categories || []).includes(cat.id)}
                          onChange={e => {
                            const current = coupon.excluded_categories || [];
                            const updated = e.target.checked ? [...current, cat.id] : current.filter((id: string) => id !== cat.id);
                            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, excluded_categories: updated } : c));
                          }}
                        /> {cat.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-2">เมนูที่ใช้ได้ (Applicable Items)</label>
                  <div className="h-32 overflow-y-auto border border-gray-200 rounded-md bg-white p-2">
                    {menuItems.map(item => (
                      <label key={item.id} className="flex items-center gap-2 text-xs py-1">
                        <input 
                          type="checkbox" 
                          checked={(coupon.applicable_items || []).includes(item.id)}
                          onChange={e => {
                            const current = coupon.applicable_items || [];
                            const updated = e.target.checked ? [...current, item.id] : current.filter((id: string) => id !== item.id);
                            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, applicable_items: updated } : c));
                          }}
                        /> {item.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-2">เมนูที่ยกเว้น (Excluded Items)</label>
                  <div className="h-32 overflow-y-auto border border-gray-200 rounded-md bg-white p-2">
                    {menuItems.map(item => (
                      <label key={item.id} className="flex items-center gap-2 text-xs py-1">
                        <input 
                          type="checkbox" 
                          checked={(coupon.excluded_items || []).includes(item.id)}
                          onChange={e => {
                            const current = coupon.excluded_items || [];
                            const updated = e.target.checked ? [...current, item.id] : current.filter((id: string) => id !== item.id);
                            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, excluded_items: updated } : c));
                          }}
                        /> {item.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image upload preview & box */}
            <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-2 bg-gray-50/50 relative min-h-[110px]">
              {coupon.image_url ? (
                <div className="w-full h-full relative group rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={coupon.image_url} alt={coupon.name} className="w-full h-24 object-cover" />
                  <button 
                    onClick={() => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, image_url: null } : c))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full text-gray-400 hover:text-blue-500 transition-colors">
                  {uploadingCouponId === coupon.id ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
                  ) : (
                    <Upload className="w-5 h-5 mb-1" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {uploadingCouponId === coupon.id ? 'Uploading...' : 'Upload Image'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCouponImage(coupon.id, file);
                    }}
                    className="hidden" 
                    disabled={uploadingCouponId === coupon.id}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );


  const renderCampaigns = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div>
          <h2 className="text-lg font-bold text-blue-900">แคมเปญแต้มคูณ (Point Multipliers)</h2>
          <p className="text-sm text-blue-700">ตั้งค่าการคูณแต้มพิเศษตามหมวดหมู่สินค้า</p>
        </div>
        <button 
          onClick={() => setCampaigns([{ id: 'new-' + Date.now(), name: '', multiplier: 2.0, applicable_categories: [], is_active: true }, ...campaigns])}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> เพิ่มแคมเปญ
        </button>
      </div>

      {campaigns.map(campaign => (
        <div key={campaign.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-500" />
              <input 
                type="text" 
                value={campaign.name} 
                onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, name: e.target.value } : c))}
                placeholder="ชื่อแคมเปญ (เช่น วันพุธแต้มคูณ 2)" 
                className="font-medium text-lg border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  checked={campaign.is_active} 
                  onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, is_active: e.target.checked } : c))}
                  className="rounded text-blue-600" 
                /> เปิดใช้งาน
              </label>
              <button onClick={() => handleSaveCampaign(campaign)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Save className="w-5 h-5" />
              </button>
              <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ตัวคูณแต้ม (Point Multiplier)</label>
              <input 
                type="number" 
                step="0.1"
                value={campaign.multiplier} 
                onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, multiplier: parseFloat(e.target.value) } : c))}
                className="w-full border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หมวดหมู่ที่ได้รับแต้มคูณ (คั่นด้วยลูกน้ำ, ว่างไว้=ทุกหมวดหมู่)</label>
              <input 
                type="text" 
                value={Array.isArray(campaign.applicable_categories) ? campaign.applicable_categories.join(', ') : campaign.applicable_categories} 
                onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, applicable_categories: e.target.value } : c))}
                placeholder="เช่น ขนม, เครื่องดื่ม (เว้นว่างคือทุกหมวดหมู่)"
                className="w-full border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Rules Engine</h1>
            <p className="text-gray-500 text-sm">ตั้งค่ากฎเกณฑ์ของระบบสมาชิก ฉายา คูปอง และแคมเปญแจกแต้ม</p>
          </div>
        </div>
        
        <button 
          onClick={handleManualReset}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Reset All Points & XP
        </button>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tiers' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Award className="w-4 h-4" /> ระดับสมาชิก (Tiers)
        </button>
        <button
          onClick={() => setActiveTab('titles')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors \${activeTab === 'titles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Tag className="w-4 h-4" /> ฉายาลูกค้า (Titles)
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors \${activeTab === 'coupons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Gift className="w-4 h-4" /> คูปองส่วนลด (Coupons)
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'campaigns' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Zap className="w-4 h-4" /> แคมเปญแต้มคูณ (Campaigns)
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'marketing' ? 'border-red-600 text-[#D3202B]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Award className="w-4 h-4" /> การตลาดอัจฉริยะ (Marketing)
        </button>
      </div>

      <div className="pt-4">
        {loading ? (
          <div className="flex justify-center p-12"><CheckCircle2 className="w-8 h-8 text-gray-300 animate-pulse" /></div>
        ) : (
          <>
            {activeTab === 'tiers' && renderTiers()}
            {activeTab === 'titles' && renderTitles()}
            {activeTab === 'coupons' && renderCoupons()}
            {activeTab === 'campaigns' && renderCampaigns()}
            {activeTab === 'marketing' && renderMarketing()}
          </>
        )}
      </div>
    </div>
  );

  function renderMarketing() {
    const handleSendBroadcast = async () => {
      if (!broadcastMessage.trim()) {
        alert('กรุณากรอกข้อความบรอดแคสต์');
        return;
      }
      const count = broadcastSegment === 'all' 
        ? allSegmentMembers.filter(m => m.line_user_id).length 
        : allSegmentMembers.filter(m => m.segment === broadcastSegment && m.line_user_id).length;

      if (count === 0) {
        alert('ไม่พบรายชื่อลูกค้าที่มีไอดี LINE ในกลุ่มเป้าหมายนี้');
        return;
      }

      if (!confirm(`ยืนยันการส่งบรอดแคสต์ LINE ไปยังลูกค้ากลุ่มนี้จำนวน ${count} คน?`)) {
        return;
      }

      setBroadcastSending(true);
      try {
        const res = await fetch('/api/admin/crm/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segment: broadcastSegment,
            message: broadcastMessage,
            couponId: broadcastCouponId || null
          })
        });
        const result = await res.json();
        if (result.success) {
          alert(`ส่งบรอดแคสต์สำเร็จไปยังลูกค้า ${result.sentCount} คน!`);
          setBroadcastMessage('สวัสดีครับคุณ {name} ทางร้าน RUSH UP คิดถึงคุณจังเลย! ขอมอบของขวัญพิเศษเป็นคูปองส่วนลดสำหรับสั่งซื้อครั้งถัดไปนะครับ เปิดแอป LINE เพื่อกดดูคูปองได้เลยครับ');
          setBroadcastCouponId('');
          loadData(); // Refresh segments and logs
        } else {
          alert('เกิดข้อผิดพลาดในการส่งบรอดแคสต์: ' + result.error);
        }
      } catch (e: any) {
        alert('เกิดข้อผิดพลาด: ' + e.message);
      } finally {
        setBroadcastSending(false);
      }
    };

    const getSegmentName = (seg: string) => {
      switch (seg) {
        case 'loyal': return 'ลูกค้าประจำ (Loyal)';
        case 'churn': return 'เริ่มห่างหาย (About to Churn)';
        case 'inactive': return 'ไม่มาซื้อนานแล้ว (Inactive)';
        case 'general': return 'ลูกค้าทั่วไป (General)';
        default: return 'ทั้งหมด';
      }
    };

    const currentSegmentMembers = broadcastSegment === 'all'
      ? allSegmentMembers
      : allSegmentMembers.filter(m => m.segment === broadcastSegment);

    return (
      <div className="space-y-6">
        {/* Segment counts section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { key: 'loyal', label: 'ลูกค้าประจำ (Loyal)', count: segmentsSummary.loyal, desc: 'ซื้อ >= 10 ครั้ง หรือ ยอดสะสม >= 3,000 และซื้อใน 14 วันล่าสุด', color: 'border-emerald-500/20 bg-emerald-50/40 text-emerald-700' },
            { key: 'churn', label: 'เริ่มห่างหาย (Churn)', count: segmentsSummary.churn, desc: 'ห่างหายไป 15 - 30 วันที่ผ่านมา', color: 'border-amber-500/20 bg-amber-50/40 text-amber-700' },
            { key: 'inactive', label: 'ไม่มาซื้อนานแล้ว (Inactive)', count: segmentsSummary.inactive, desc: 'ไม่มียอดซื้อเกิน 30 วันขึ้นไป', color: 'border-red-500/20 bg-red-50/40 text-[#D3202B]' },
            { key: 'general', label: 'ทั่วไป (General)', count: segmentsSummary.general, desc: 'ลูกค้าทั่วไปที่ไม่เข้าเกณฑ์ข้างบน', color: 'border-gray-500/20 bg-gray-50/40 text-gray-700' },
          ].map(item => (
            <div 
              key={item.key} 
              onClick={() => {
                setBroadcastSegment(item.key);
                setSelectedSegmentDetail(item.key);
              }}
              className={`p-5 border rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${item.color} ${
                broadcastSegment === item.key ? 'ring-2 ring-offset-2 ring-red-500' : ''
              }`}
            >
              <h4 className="text-xs font-black uppercase tracking-wider opacity-85">{item.label}</h4>
              <p className="text-3xl font-black my-2">{item.count || 0} <span className="text-sm font-bold opacity-80">คน</span></p>
              <p className="text-[10px] leading-relaxed opacity-75 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white p-6 border border-gray-200 rounded-[24px] space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Zap className="w-5 h-5 text-red-500" />
              <h3 className="font-black text-lg text-gray-900">สร้างแคมเปญแจ้งเตือน LINE</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">กลุ่มเป้าหมาย (Target Segment)</label>
                <select 
                  value={broadcastSegment} 
                  onChange={e => setBroadcastSegment(e.target.value)}
                  className="w-full border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-neutral-50 px-4 py-3"
                >
                  <option value="churn">เริ่มห่างหาย (About to Churn) - {segmentsSummary.churn} คน</option>
                  <option value="inactive">ไม่มาซื้อนานแล้ว (Inactive) - {segmentsSummary.inactive} คน</option>
                  <option value="loyal">ลูกค้าประจำ (Loyal) - {segmentsSummary.loyal} คน</option>
                  <option value="general">ทั่วไป (General) - {segmentsSummary.general} คน</option>
                  <option value="all">ลูกค้าทุกคนในฐานข้อมูล (All) - {segmentsSummary.total} คน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">แนบคูปองแจกฟรี (Attach Coupon Gift)</label>
                <select 
                  value={broadcastCouponId} 
                  onChange={e => setBroadcastCouponId(e.target.value)}
                  className="w-full border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-neutral-50 px-4 py-3"
                >
                  <option value="">-- ไม่แนบคูปอง (ส่งเฉพาะข้อความอย่างเดียว) --</option>
                  {coupons.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>🎁 {c.name} (แลกปกติใช้ {c.cost_points} แต้ม)</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-normal">
                  *ระบบจะดึงคูปองข้างต้นผูกเข้าไปในบัญชี LINE LIFF &quot;คูปองของฉัน&quot; ของลูกค้าเป้าหมายทันทีโดยไม่เสียคะแนน
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400">ข้อความบรอดแคสต์ (Personalized Message)</label>
                  <span className="text-[10px] text-red-500 font-bold">ใส่ตัวแปร &#123;name&#125; หรือ &#123;points&#125; เพื่อระบุชื่อพนักงาน/แต้มจริงได้</span>
                </div>
                <textarea 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="พิมพ์ข้อความที่ต้องการส่งตรงถึง LINE ของลูกค้า..."
                  className="w-full border-gray-300 rounded-xl text-sm font-medium text-gray-800 p-4 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <button 
                onClick={handleSendBroadcast}
                disabled={broadcastSending}
                className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all ${
                  broadcastSending 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#D3202B] hover:bg-red-700 active:scale-95 shadow-md shadow-red-500/10'
                }`}
              >
                {broadcastSending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังส่งบรอดแคสต์...
                  </div>
                ) : (
                  'ส่งบรอดแคสต์ LINE'
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Member Details */}
          <div className="lg:col-span-5 bg-white p-6 border border-gray-200 rounded-[24px] shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-md text-gray-900">รายชื่อในกลุ่ม: {getSegmentName(broadcastSegment)}</h3>
              </div>
              <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                {currentSegmentMembers.length} คน
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {currentSegmentMembers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <AlertTriangle className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-400">ไม่พบลูกค้าในหมวดหมู่นี้</p>
                </div>
              ) : (
                currentSegmentMembers.map(m => (
                  <div key={m.id} className="p-3 bg-neutral-50/60 hover:bg-neutral-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400">
                            {String(m.display_name || '?').slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-800 truncate leading-snug">{m.display_name || 'ลูกค้าไม่มีชื่อ'}</p>
                        <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                          {m.phone || 'ไม่มีเบอร์โทร'} • R: {m.rfm.recency} วัน • F: {m.rfm.frequency} ครั้ง
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {m.line_user_id ? (
                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          LINE CONNECTED
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                          NO LINE
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Broadcast History logs */}
        <div className="bg-white p-6 border border-gray-200 rounded-[24px] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-black text-md text-gray-900">ประวัติแคมเปญส่งข้อความย้อนหลัง (LINE Logs)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-neutral-50/50">
                <tr>
                  <th className="px-4 py-3">วันเวลาที่ส่ง</th>
                  <th className="px-4 py-3">กลุ่มเป้าหมาย</th>
                  <th className="px-4 py-3">ข้อความ</th>
                  <th className="px-4 py-3">คูปองที่แนบ</th>
                  <th className="px-4 py-3 text-center">ส่งสำเร็จ / ล้มเหลว</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {broadcastLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 font-bold">ไม่พบประวัติการยิงบรอดแคสต์การตลาดในฐานข้อมูล</td>
                  </tr>
                ) : (
                  broadcastLogs.map(log => {
                    const details = log.details || {};
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-gray-900">
                          {getSegmentName(details.segment)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={details.message}>
                          {details.message}
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-[#D3202B]">
                          {details.couponName ? `🎁 ${details.couponName}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-center font-black whitespace-nowrap">
                          <span className="text-emerald-600">{details.successCount || 0} คน</span>
                          {details.errorCount > 0 && (
                            <span className="text-red-500 ml-1">/ {details.errorCount} คน</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
