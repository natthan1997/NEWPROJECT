'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/I18nContext';
import { 
  Users, Gift, Award, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, Save 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CrmSettingsPage() {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'tiers' | 'campaigns' | 'rewards'>('tiers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [tiers, setTiers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);

  // Editing state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if tables exist by querying them
      const { data: tData, error: tError } = await supabase.from('pos_loyalty_tiers').select('*').order('min_points', { ascending: true });
      if (tError) {
        if (tError.message.includes('relation "pos_loyalty_tiers" does not exist')) {
          setError('Migration Required: Please run the SQL migration script to create CRM tables.');
          setLoading(false);
          return;
        }
        throw tError;
      }
      setTiers(tData || []);

      const { data: cData, error: cError } = await supabase.from('pos_campaigns').select('*').order('sort_order', { ascending: true });
      if (cError) throw cError;
      setCampaigns(cData || []);

      const { data: rData, error: rError } = await supabase.from('pos_rewards').select('*').order('points_required', { ascending: true });
      if (rError && !rError.message.includes('does not exist')) throw rError;
      setRewards(rData || []);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      setSaving(true);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setSuccess('Deleted successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleSave = async (table: string, data: any) => {
    try {
      setSaving(true);
      if (data.id) {
        const { error } = await supabase.from(table).update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([data]);
        if (error) throw error;
      }
      setSuccess('Saved successfully');
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openAddModal = (type: string) => {
    let newItem = {};
    if (type === 'tiers') {
      newItem = { name: '', min_points: 0, bg_color: 'bg-[#F2ECE4]', text_color: 'text-[#8C6D53]', bar_color: 'bg-[#C19A6B]', benefits: [], is_active: true };
    } else if (type === 'campaigns') {
      newItem = { title: '', description: '', icon: '🎁', type_tag: 'Campaign', bg_gradient_from: 'from-[#EBF1F5]', bg_gradient_to: 'to-[#D6E4EE]', text_color: 'text-[#1F333C]', tag_color: 'text-[#3E6578]', is_active: true, sort_order: 0 };
    } else if (type === 'rewards') {
      newItem = { name: '', title: '', description: '', points_required: 100, is_active: true, image_url: '' };
    }
    setEditingItem(newItem);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM & Loyalty</h1>
          <p className="text-gray-500">Manage member tiers, special campaigns, and point rewards.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'tiers' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
            }`}
          >
            <Users className="w-4 h-4" /> Tiers (ระดับสมาชิก)
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'campaigns' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
            }`}
          >
            <Award className="w-4 h-4" /> Campaigns (แคมเปญกระตุ้น)
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'rewards' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
            }`}
          >
            <Gift className="w-4 h-4" /> Rewards (ของรางวัล)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => openAddModal(activeTab)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add New {activeTab === 'tiers' ? 'Tier' : activeTab === 'campaigns' ? 'Campaign' : 'Reward'}
                </button>
              </div>

              {activeTab === 'tiers' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {tiers.map((tier) => (
                    <div key={tier.id} className={`p-5 rounded-xl border border-gray-100 ${tier.bg_color || 'bg-gray-50'} relative group`}>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => openEditModal(tier)} className="p-1.5 bg-white/80 rounded-md text-gray-600 hover:text-gray-900"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('pos_loyalty_tiers', tier.id)} className="p-1.5 bg-white/80 rounded-md text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className={`text-lg font-bold ${tier.text_color}`}>{tier.name}</h3>
                        <span className="text-sm text-gray-500">{tier.min_points.toLocaleString()} Points</span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        {(tier.benefits || []).map((b: string, i: number) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="mt-0.5 text-gray-400">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {tiers.length === 0 && <p className="text-gray-500 italic col-span-2 text-center py-10">No tiers configured.</p>}
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="grid md:grid-cols-3 gap-4">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className={`p-4 rounded-xl border border-gray-100 relative group bg-gradient-to-br ${camp.bg_gradient_from} ${camp.bg_gradient_to}`}>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                        <button onClick={() => openEditModal(camp)} className="p-1.5 bg-white/80 rounded-md text-gray-600 hover:text-gray-900"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('pos_campaigns', camp.id)} className="p-1.5 bg-white/80 rounded-md text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="absolute -right-4 -top-4 text-6xl opacity-10">{camp.icon}</div>
                      
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${camp.tag_color} bg-white/50 px-2 py-1 rounded-md mb-2 inline-block relative z-10`}>
                        {camp.type_tag}
                      </span>
                      <h4 className={`text-[14px] font-semibold ${camp.text_color} leading-tight mb-1 relative z-10`}>{camp.title}</h4>
                      <p className={`text-[12px] ${camp.tag_color} relative z-10`}>{camp.description}</p>
                      
                      {!camp.is_active && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
                          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">Inactive</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {campaigns.length === 0 && <p className="text-gray-500 italic col-span-3 text-center py-10">No campaigns configured.</p>}
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white relative group">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => openEditModal(reward)} className="p-1.5 bg-gray-100 rounded-md text-gray-600 hover:text-gray-900"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('pos_rewards', reward.id)} className="p-1.5 bg-red-50 rounded-md text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift size={24} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[14px] font-medium text-gray-900">{reward.title || reward.name} {!reward.is_active && <span className="text-xs text-red-500 font-normal ml-2">(Inactive)</span>}</h4>
                        <p className="text-[12px] text-gray-500 mt-1">{reward.description}</p>
                        <p className="text-[13px] font-bold text-gray-900 mt-2">{reward.points_required?.toLocaleString()} Pts</p>
                      </div>
                    </div>
                  ))}
                  {rewards.length === 0 && <p className="text-gray-500 italic text-center py-10">No rewards configured.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative z-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingItem.id ? 'Edit' : 'Add'} {activeTab === 'tiers' ? 'Tier' : activeTab === 'campaigns' ? 'Campaign' : 'Reward'}
              </h2>
              
              <div className="space-y-4">
                {activeTab === 'tiers' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                      <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} placeholder="e.g. Bronze" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.min_points || 0} onChange={e => setEditingItem({...editingItem, min_points: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BG Class</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-xs" value={editingItem.bg_color || ''} onChange={e => setEditingItem({...editingItem, bg_color: e.target.value})} placeholder="bg-[#F2ECE4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Class</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-xs" value={editingItem.text_color || ''} onChange={e => setEditingItem({...editingItem, text_color: e.target.value})} placeholder="text-[#8C6D53]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bar Class</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-xs" value={editingItem.bar_color || ''} onChange={e => setEditingItem({...editingItem, bar_color: e.target.value})} placeholder="bg-[#C19A6B]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (One per line)</label>
                      <textarea 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm h-32" 
                        value={(editingItem.benefits || []).join('\n')} 
                        onChange={e => setEditingItem({...editingItem, benefits: e.target.value.split('\n').filter(b => b.trim())})} 
                        placeholder="Benefit 1&#10;Benefit 2" 
                      />
                    </div>
                  </>
                )}

                {activeTab === 'campaigns' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.icon || ''} onChange={e => setEditingItem({...editingItem, icon: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tag (e.g. Flash Event)</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.type_tag || ''} onChange={e => setEditingItem({...editingItem, type_tag: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gradient From Class</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.bg_gradient_from || ''} onChange={e => setEditingItem({...editingItem, bg_gradient_from: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gradient To Class</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.bg_gradient_to || ''} onChange={e => setEditingItem({...editingItem, bg_gradient_to: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={editingItem.is_active !== false} onChange={e => setEditingItem({...editingItem, is_active: e.target.checked})} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                        <span className="text-sm font-medium text-gray-700">Campaign Active</span>
                      </label>
                    </div>
                  </>
                )}

                {activeTab === 'rewards' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
                      <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.title || editingItem.name || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" rows={3} value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.points_required || 0} onChange={e => setEditingItem({...editingItem, points_required: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" value={editingItem.image_url || ''} onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={editingItem.is_active !== false} onChange={e => setEditingItem({...editingItem, is_active: e.target.checked})} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                        <span className="text-sm font-medium text-gray-700">Reward Active</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSave(
                    activeTab === 'tiers' ? 'pos_loyalty_tiers' : activeTab === 'campaigns' ? 'pos_campaigns' : 'pos_rewards',
                    editingItem
                  )}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
