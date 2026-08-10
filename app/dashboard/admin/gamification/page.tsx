'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, Trophy, Gift } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminGamificationPage() {
  const [activeTab, setActiveTab] = useState<'missions' | 'gacha'>('missions');
  
  // -- Missions State --
  const [missions, setMissions] = useState<any[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [missionFormData, setMissionFormData] = useState({
    title: '',
    description: '',
    reward_tickets: 1,
    campaign_type: 'weekly',
    is_active: true,
    condition_rules_type: 'order_item',
    condition_rules_category: '',
    condition_rules_count: 1,
    condition_rules_start_time: '',
    condition_rules_end_time: '',
    condition_rules_min_spend: 0
  });

  // -- Gacha State --
  const [gachaPool, setGachaPool] = useState<any[]>([]);
  const [gachaLoading, setGachaLoading] = useState(true);
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [editingGacha, setEditingGacha] = useState<any>(null);
  const [gachaFormData, setGachaFormData] = useState({
    name: '',
    description: '',
    rarity_tier: 'R',
    probability_weight: 10,
    reward_type: 'points',
    item_id: '',
    value_points: 0,
    is_active: true,
    max_quantity: '',
  });

  // -- Coupons State --
  const [coupons, setCoupons] = useState<any[]>([]);

  useEffect(() => {
    fetchMissions();
    fetchGachaPool();
    fetchCoupons();
  }, []);

  // -- API Calls: Missions --
  const fetchMissions = async () => {
    try {
      setMissionsLoading(true);
      const res = await fetch('/api/admin/gamification/missions');
      const data = await res.json();
      if (data.success) {
        setMissions(data.missions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMissionsLoading(false);
    }
  };

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingMission?.id,
        title: missionFormData.title,
        description: missionFormData.description,
        reward_tickets: missionFormData.reward_tickets,
        campaign_type: missionFormData.campaign_type,
        is_active: missionFormData.is_active,
        condition_rules: {
          type: missionFormData.condition_rules_type,
          category: missionFormData.condition_rules_category,
          count: missionFormData.condition_rules_count,
          start_time: missionFormData.condition_rules_start_time,
          end_time: missionFormData.condition_rules_end_time,
          min_spend: missionFormData.condition_rules_min_spend
        }
      };

      const res = await fetch('/api/admin/gamification/missions', {
        method: editingMission ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500 });
        setShowMissionModal(false);
        fetchMissions();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;
    try {
      const res = await fetch(`/api/admin/gamification/missions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMissions();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -- API Calls: Gacha --
  const fetchGachaPool = async () => {
    try {
      setGachaLoading(true);
      const res = await fetch('/api/admin/gamification/gacha');
      const data = await res.json();
      if (data.success) {
        setGachaPool(data.pool);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGachaLoading(false);
    }
  };

  const handleSaveGacha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingGacha?.id,
        name: gachaFormData.name,
        description: gachaFormData.description,
        rarity_tier: gachaFormData.rarity_tier,
        probability_weight: gachaFormData.probability_weight,
        reward_type: gachaFormData.reward_type,
        item_id: gachaFormData.item_id || null,
        value_points: gachaFormData.value_points,
        is_active: gachaFormData.is_active,
        max_quantity: gachaFormData.max_quantity ? parseInt(gachaFormData.max_quantity as string) : null,
      };

      const res = await fetch('/api/admin/gamification/gacha', {
        method: editingGacha ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500 });
        setShowGachaModal(false);
        fetchGachaPool();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGacha = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/admin/gamification/gacha?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchGachaPool();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -- API Calls: Coupons --
  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/gamification/coupons', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error('Failed to fetch coupons:', e);
    }
  };

  // -- Modals --
  const openNewMission = () => {
    setEditingMission(null);
    setMissionFormData({
      title: '', description: '', reward_tickets: 1, campaign_type: 'weekly', is_active: true,
      condition_rules_type: 'order_item', condition_rules_category: '', condition_rules_count: 1,
      condition_rules_start_time: '', condition_rules_end_time: '', condition_rules_min_spend: 0
    });
    setShowMissionModal(true);
  };

  const openEditMission = (m: any) => {
    setEditingMission(m);
    setMissionFormData({
      title: m.title, description: m.description, reward_tickets: m.reward_tickets, campaign_type: m.campaign_type || 'weekly', is_active: m.is_active,
      condition_rules_type: m.condition_rules?.type || 'order_item',
      condition_rules_category: m.condition_rules?.category || '',
      condition_rules_count: m.condition_rules?.count || 1,
      condition_rules_start_time: m.condition_rules?.start_time || '',
      condition_rules_end_time: m.condition_rules?.end_time || '',
      condition_rules_min_spend: m.condition_rules?.min_spend || 0
    });
    setShowMissionModal(true);
  };

  const openNewGacha = () => {
    setEditingGacha(null);
    setGachaFormData({
      name: '', description: '', rarity_tier: 'R', probability_weight: 10,
      reward_type: 'points', item_id: '', value_points: 0, is_active: true, max_quantity: ''
    });
    setShowGachaModal(true);
  };

  const openEditGacha = (g: any) => {
    setEditingGacha(g);
    setGachaFormData({
      name: g.name, description: g.description || '', rarity_tier: g.rarity_tier,
      probability_weight: g.probability_weight, reward_type: g.reward_type,
      item_id: g.item_id || '',
      value_points: g.value_points, is_active: g.is_active, max_quantity: g.max_quantity || ''
    });
    setShowGachaModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ระบบจัดแคมเปญ & กาชา (Gamification)</h1>
        <p className="text-gray-500 text-sm mt-1">จัดการภารกิจและของรางวัลในตู้กาชาปอง</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('missions')}
          className={`pb-3 font-semibold text-[15px] transition-colors relative ${activeTab === 'missions' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-2 px-2">
            <Trophy size={18} />
            <span>ภารกิจ (Missions)</span>
          </div>
          {activeTab === 'missions' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('gacha')}
          className={`pb-3 font-semibold text-[15px] transition-colors relative ${activeTab === 'gacha' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="flex items-center gap-2 px-2">
            <Gift size={18} />
            <span>ของรางวัลตู้กาชา (Gacha Pool)</span>
          </div>
          {activeTab === 'gacha' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black rounded-t-full"></div>}
        </button>
      </div>

      {/* ---------------- MISSIONS TAB ---------------- */}
      {activeTab === 'missions' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openNewMission} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm font-semibold">
              <Plus size={16} /> New Campaign
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-sm font-semibold text-gray-600">Campaign Title</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Reward (Tickets)</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missionsLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : missions.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No campaigns found.</td></tr>
                  ) : (
                    missions.map((m) => (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">{m.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{m.description}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            m.campaign_type === 'daily' ? 'bg-blue-100 text-blue-700' :
                            m.campaign_type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                            m.campaign_type === 'monthly' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {m.campaign_type === 'daily' ? 'รายวัน' : 
                             m.campaign_type === 'weekly' ? 'รายสัปดาห์' : 
                             m.campaign_type === 'monthly' ? 'รายเดือน' : 'พิเศษ'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
                            +{m.reward_tickets}
                          </div>
                        </td>
                        <td className="p-4">
                          {m.is_active ? (
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditMission(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteMission(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---------------- GACHA TAB ---------------- */}
      {activeTab === 'gacha' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 shadow-sm flex items-center gap-2">
              <span className="font-bold">Tip:</span> โอกาสออกของแต่ละชิ้นจะคำนวณจากน้ำหนักสัดส่วน (Weight) ของทุกชิ้นในตู้รวมกัน 
              <span className="text-xs ml-1 bg-white px-2 py-0.5 rounded text-blue-600 font-bold border border-blue-100">เรทออกรวมตอนนี้: {gachaPool.reduce((sum, item) => sum + (item.is_active ? Number(item.drop_rate_percentage) : 0), 0).toFixed(2)}%</span>
            </div>
            <button onClick={openNewGacha} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm font-semibold shadow-sm">
              <Plus size={16} /> เพิ่มของรางวัล
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-sm font-bold text-gray-600">ชื่อของรางวัล</th>
                    <th className="p-4 text-sm font-bold text-gray-600">ระดับ (Rarity)</th>
                    <th className="p-4 text-sm font-bold text-gray-600">ประเภทรางวัล</th>
                    <th className="p-4 text-sm font-bold text-gray-600">โอกาสออกจริง</th>
                    <th className="p-4 text-sm font-bold text-gray-600">สถานะ</th>
                    <th className="p-4 text-sm font-bold text-gray-600 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {gachaLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                        กำลังโหลดข้อมูลตู้กาชา...
                      </td>
                    </tr>
                  ) : gachaPool.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">ยังไม่มีของรางวัลในระบบ กรุณากดปุ่มเพิ่มของรางวัล</td></tr>
                  ) : (
                    gachaPool.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            item.rarity_tier === 'UR' ? 'bg-fuchsia-100 text-fuchsia-700' :
                            item.rarity_tier === 'SR' ? 'bg-amber-100 text-amber-700' :
                            item.rarity_tier === 'R' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.rarity_tier}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                              {item.reward_type === 'points' ? 'พอยท์ (Points)' :
                               item.reward_type === 'coupon' ? 'คูปองในระบบ (Coupon)' :
                               item.reward_type === 'discount' ? 'โค้ดส่วนลด' :
                               item.reward_type === 'free_item' ? 'สินค้าฟรี' : 'จัดการเอง (Manual)'}
                          </div>
                          {item.reward_type === 'points' && <div className="text-xs text-green-600 font-bold mt-0.5">+{item.value_points} แต้ม</div>}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 bg-gray-50 inline-block px-2 py-1 rounded-md border border-gray-200">{Number(item.drop_rate_percentage).toFixed(2)}%</div>
                          <div className="text-[10px] text-gray-400 mt-1">น้ำหนักสุ่ม: {item.probability_weight}</div>
                        </td>
                        <td className="p-4">
                          {item.is_active ? (
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> เปิดใช้งาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> ปิดใช้งาน
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditGacha(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteGacha(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---------------- MODALS ---------------- */}
      {/* Mission Modal */}
      {showMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{editingMission ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowMissionModal(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMission} className="p-6 overflow-y-auto">
              {/* Mission form fields remain same as original */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                  <input type="text" required value={missionFormData.title} onChange={(e) => setMissionFormData({...missionFormData, title: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-black outline-none transition-shadow" placeholder="e.g., ซื้อกาแฟครบ 3 แก้ว" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required rows={2} value={missionFormData.description} onChange={(e) => setMissionFormData({...missionFormData, description: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-black outline-none transition-shadow" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={missionFormData.campaign_type} onChange={(e) => setMissionFormData({...missionFormData, campaign_type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-black outline-none bg-white">
                      <option value="daily">รายวัน (Daily)</option>
                      <option value="weekly">รายสัปดาห์ (Weekly)</option>
                      <option value="monthly">รายเดือน (Monthly)</option>
                      <option value="special">พิเศษ (Special)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reward Tickets</label>
                    <input type="number" required min={1} value={missionFormData.reward_tickets} onChange={(e) => setMissionFormData({...missionFormData, reward_tickets: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-black outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={missionFormData.is_active ? 'true' : 'false'} onChange={(e) => setMissionFormData({...missionFormData, is_active: e.target.value === 'true'})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-black outline-none bg-white">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Condition Rules</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Rule Type</label>
                      <select value={missionFormData.condition_rules_type} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                        <option value="order_item">Order Items</option>
                        <option value="social_share">Social Share</option>
                        <option value="time_bound">Time Bound Purchase</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Target Count</label>
                        <input type="number" min={1} value={missionFormData.condition_rules_count} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_count: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                      </div>
                      {missionFormData.condition_rules_type === 'order_item' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Category (Optional)</label>
                          <input type="text" value={missionFormData.condition_rules_category} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_category: e.target.value})} placeholder="e.g. Coffee" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                        </div>
                      )}
                    </div>
                    {missionFormData.condition_rules_type === 'time_bound' && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                          <input type="time" value={missionFormData.condition_rules_start_time} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_start_time: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                          <input type="time" value={missionFormData.condition_rules_end_time} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_end_time: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Min Spend (THB)</label>
                          <input type="number" min={0} value={missionFormData.condition_rules_min_spend} onChange={(e) => setMissionFormData({...missionFormData, condition_rules_min_spend: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowMissionModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center gap-2"><Save size={18} /> Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gacha Modal */}
      {showGachaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{editingGacha ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}</h2>
              <button onClick={() => setShowGachaModal(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveGacha} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อของรางวัล (แสดงบนมือถือลูกค้า) <span className="text-red-500">*</span></label>
                  <input type="text" required value={gachaFormData.name} onChange={(e) => setGachaFormData({...gachaFormData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none transition-shadow" placeholder="เช่น ฟรีอเมริกาโน่ 1 แก้ว, +50 แต้ม" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ระดับความหายาก (Rarity) <span className="text-red-500">*</span></label>
                    <select value={gachaFormData.rarity_tier} onChange={(e) => setGachaFormData({...gachaFormData, rarity_tier: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none bg-white font-medium">
                      <option value="N">Normal (N) - ธรรมดา</option>
                      <option value="R">Rare (R) - แรร์</option>
                      <option value="SR">Super Rare (SR) - หายาก</option>
                      <option value="UR">Ultra Rare (UR) - หายากสุดๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">สัดส่วนน้ำหนักโอกาสออก <span className="text-red-500">*</span></label>
                    <input type="number" required min={0} value={gachaFormData.probability_weight} onChange={(e) => setGachaFormData({...gachaFormData, probability_weight: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none font-bold text-blue-700 bg-blue-50/50" />
                    <div className="text-[10px] text-gray-500 mt-1">ยิ่งเลขเยอะ โอกาสออกยิ่งสูง</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ประเภทของรางวัล <span className="text-red-500">*</span></label>
                    <select value={gachaFormData.reward_type} onChange={(e) => setGachaFormData({...gachaFormData, reward_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none bg-white text-sm">
                      <option value="points">แจกแต้มสะสม (เพิ่มให้อัตโนมัติ)</option>
                      <option value="coupon">แจกคูปอง (ส่งเข้า My Rewards)</option>
                      <option value="discount">แจกส่วนลดหน้าร้าน</option>
                      <option value="free_item">แจกสินค้าฟรี (รับที่ร้าน)</option>
                      <option value="other">อื่นๆ (พนักงานจัดการเอง)</option>
                    </select>
                  </div>
                  {gachaFormData.reward_type === 'points' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">จำนวนแต้มที่จะแจก</label>
                      <input type="number" min={0} value={gachaFormData.value_points} onChange={(e) => setGachaFormData({...gachaFormData, value_points: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none text-green-700 font-bold bg-green-50/50" placeholder="ระบุตัวเลขแต้ม" />
                    </div>
                  )}
                  {gachaFormData.reward_type === 'coupon' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">เลือกคูปองที่จะแจก</label>
                      <select value={gachaFormData.item_id} onChange={(e) => setGachaFormData({...gachaFormData, item_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none bg-white">
                        <option value="">-- กรุณาเลือกคูปองในระบบ --</option>
                        {coupons.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">คำอธิบายเพิ่มเติม (ถ้ามี)</label>
                  <textarea rows={2} value={gachaFormData.description} onChange={(e) => setGachaFormData({...gachaFormData, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none transition-shadow text-sm" placeholder="เช่น เงื่อนไขการรับรางวัล, หมายเหตุสำหรับพนักงาน..." />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">สถานะ</label>
                    <select value={gachaFormData.is_active ? 'true' : 'false'} onChange={(e) => setGachaFormData({...gachaFormData, is_active: e.target.value === 'true'})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none bg-white">
                      <option value="true">เปิดใช้งาน (หย่อนลงตู้)</option>
                      <option value="false">ปิดใช้งานชั่วคราว</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">จำนวนจำกัดทั้งหมด</label>
                    <input type="number" min={1} value={gachaFormData.max_quantity} onChange={(e) => setGachaFormData({...gachaFormData, max_quantity: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-black outline-none bg-gray-50/50" placeholder="ปล่อยว่างหากแจกไม่อั้น" />
                  </div>
                </div>

              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowGachaModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold shadow-sm">ยกเลิก</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#1A1A18] text-white rounded-xl hover:bg-black transition-colors font-bold flex items-center justify-center gap-2 shadow-lg"><Save size={18} /> บันทึกของรางวัล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
