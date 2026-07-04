import fs from 'fs';

const filePath = 'components/pos/POSHistory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add selectedDate state
content = content.replace(
    `  const [paymentEditOpen, setPaymentEditOpen] = useState(false)`,
    `  const [paymentEditOpen, setPaymentEditOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())`
);

// 2. Modify fetchCompletedOrders to use selectedDate and updated_at
content = content.replace(
    `      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('pos_orders')
        .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status)')
        .in('status', ['paid', 'completed', 'cancelled'])
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false })`,
    `      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0)
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)
      
      const { data, error } = await supabase
        .from('pos_orders')
        .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status)')
        .in('status', ['paid', 'completed', 'cancelled'])
        .gte('updated_at', startOfDay.toISOString())
        .lt('updated_at', endOfDay.toISOString())
        .order('updated_at', { ascending: false })`
);

// 3. Add selectedDate to dependencies
content = content.replace(
    `  }, [shopSettings?.branch_id, activeShift?.branch_id])`,
    `  }, [shopSettings?.branch_id, activeShift?.branch_id, selectedDate])`
);

// 4. Modify the header to include the date picker
const headerTarget = `        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#1A1A18]">{locale === 'en' ? 'HISTORY' : locale === 'zh' ? 'HISTORY' : 'HISTORY'}</h2>
          <p className="mt-1 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
            Sales History · {completedOrders.length} {locale === 'en' ? ' รายการ           ' : locale === 'zh' ? ' รายการ           ' : ' รายการ           '}</p>
        </div>
        <button
          onClick={fetchCompletedOrders}
          disabled={loading}
          className="flex items-center gap-2 border border-[#F0F0E8] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-black hover:text-white disabled:opacity-50"
        >`;
const headerReplacement = `        <div className="flex flex-col">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#1A1A18]">{locale === 'en' ? 'HISTORY' : locale === 'zh' ? 'HISTORY' : 'HISTORY'}</h2>
          <p className="mt-1 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
            Sales History · {completedOrders.length} {locale === 'en' ? ' รายการ           ' : locale === 'zh' ? ' รายการ           ' : ' รายการ           '}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(new Date(e.target.value))
              }
            }}
            className="border border-[#F0F0E8] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none"
          />
          <button
            onClick={fetchCompletedOrders}
            disabled={loading}
            className="flex items-center gap-2 border border-[#F0F0E8] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-black hover:text-white disabled:opacity-50"
          >`;
content = content.replace(headerTarget, headerReplacement);

fs.writeFileSync(filePath, content);
console.log('POSHistory updated');
