'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Plus, Trash2, Tag, Gift, Zap, Edit2, CheckCircle2, Award, AlertTriangle, Upload, X, Image } from 'lucide-react';

export default function LoyaltySettingsPage() {
  const [activeTab, setActiveTab] = useState<'tiers' | 'titles' | 'coupons' | 'campaigns'>('tiers');
  const [tiers, setTiers] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tr, t, c, camp, m, cat] = await Promise.all([
      supabase.from('pos_member_tiers').select('*').order('min_points', { ascending: true }),
      supabase.from('pos_loyalty_titles').select('*').order('rule_threshold', { ascending: true }),
      supabase.from('pos_loyalty_coupons').select('*').order('cost_points', { ascending: true }),
      supabase.from('pos_loyalty_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('pos_menu_items').select('id, name').eq('is_active', true).order('name'),
      supabase.from('pos_menu_categories').select('id, name').order('name')
    ]);
    if (tr.data) setTiers(tr.data);
    if (t.data) setTitles(t.data);
    if (c.data) setCoupons(c.data);
    if (camp.data) setCampaigns(camp.data);
    if (m.data) setMenuItems(m.data);
    if (cat.data) setCategories(cat.data);
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
    if (id.startsWith('new-')) {
      await supabase.from('pos_loyalty_coupons').insert([data]);
    } else {
      await supabase.from('pos_loyalty_coupons').update(data).eq('id', id);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `coupon_${Date.now()}.${fileExt}`;
      const filePath = `coupons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, image_url: publicUrl } : c));
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
      fetchData();
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    if (!id.startsWith('new-')) {
      const { error } = await supabase.from('pos_loyalty_campaigns').delete().eq('id', id);
      if (error) return alert('Error: ' + error.message);
    }
    fetchData();
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
              <button onClick={() => handleSaveCoupon(coupon)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Save className="w-5 h-5" />
              </button>
              <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option value="free_item">ฟรี 1 รายการ (ลดของที่ถูกสุด)</option>
                  <option value="percent">ส่วนลด %</option>
                  <option value="fixed">ส่วนลดบาท</option>
                </select>
              </div>
              {coupon.discount_type !== 'free_item' ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">มูลค่า (Value)</label>
                  <input 
                    type="number" 
                    value={coupon.discount_value || 0} 
                    onChange={e => setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, discount_value: parseFloat(e.target.value) } : c))}
                    className="w-full border-gray-300 rounded-md text-sm"
                  />
                </div>
              ) : (
                <div />
              )}
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
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors \${activeTab === 'campaigns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Zap className="w-4 h-4" /> แคมเปญแต้มคูณ (Campaigns)
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
          </>
        )}
      </div>
    </div>
  );
}
