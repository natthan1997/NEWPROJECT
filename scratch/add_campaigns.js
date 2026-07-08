const fs = require('fs');

let content = fs.readFileSync('app/dashboard/admin/pos-settings/crm/page.tsx', 'utf8');

// Add handleDeleteCampaign and handleSaveCampaign
const handlerCode = `
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
          point_multiplier: campaign.point_multiplier, 
          applicable_categories: parsedCategories, 
          is_active: campaign.is_active 
        }])
      : await supabase.from('pos_loyalty_campaigns').update({ 
          name: campaign.name, 
          point_multiplier: campaign.point_multiplier, 
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
`;

content = content.replace('const renderTitles = () => (', handlerCode + '\n  const renderTitles = () => (');

// Add renderCampaigns
const renderCode = `
  const renderCampaigns = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div>
          <h2 className="text-lg font-bold text-blue-900">แคมเปญแต้มคูณ (Point Multipliers)</h2>
          <p className="text-sm text-blue-700">ตั้งค่าการคูณแต้มพิเศษตามหมวดหมู่สินค้า</p>
        </div>
        <button 
          onClick={() => setCampaigns([{ id: 'new-' + Date.now(), name: '', point_multiplier: 2.0, applicable_categories: [], is_active: true }, ...campaigns])}
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
                value={campaign.point_multiplier} 
                onChange={e => setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, point_multiplier: parseFloat(e.target.value) } : c))}
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
`;

content = content.replace('  return (', renderCode + '\n  return (');

const toReplace = `{activeTab === 'campaigns' && (
              <div className="p-8 text-center text-gray-500 bg-gray-50 border border-gray-200 rounded-xl border-dashed">
                <Zap className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p>ระบบแคมเปญแต้มคูณ (Coming soon)</p>
                <p className="text-sm mt-1">ใช้สำหรับการตั้งโปรโมชันตามช่วงเวลา เช่น แจกแต้ม x2 ในวันเสาร์อาทิตย์</p>
              </div>
            )}`;

content = content.replace(toReplace, `{activeTab === 'campaigns' && renderCampaigns()}`);

fs.writeFileSync('app/dashboard/admin/pos-settings/crm/page.tsx', content);
