const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/PointGenerator.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add earn rate state and fetch it
const target1 = `  const [loading, setLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);`;

const replacement1 = `  const [loading, setLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [earnRate, setEarnRate] = useState<number>(1); // 1 THB = 1 Point by default

  useEffect(() => {
    // Fetch shop settings for earn rate
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('pos_shop_settings')
        .select('loyalty_earn_rate')
        .limit(1)
        .single();
      if (data && data.loyalty_earn_rate) {
        setEarnRate(data.loyalty_earn_rate);
      }
    };
    fetchSettings();
  }, []);`;

code = code.replace(target1, replacement1);

// Update calculation
const target2 = `  // 1 THB = 1 Point
  const pointsToGenerate = parseInt(purchaseAmount) || 0;`;

const replacement2 = `  // Calculate points based on earn rate
  const amountInt = parseInt(purchaseAmount) || 0;
  const pointsToGenerate = earnRate > 0 ? Math.floor(amountInt / earnRate) : 0;`;

code = code.replace(target2, replacement2);

// Show the rate in the UI
const target3 = `                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1 text-center">
                    {locale === 'en' ? 'Purchase Amount (THB)' : 'กรอกยอดชำระเงินของลูกค้า (บาท)'}
                  </p>`;

const replacement3 = `                <div className="mb-3">
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center flex-1">
                      {locale === 'en' ? 'Purchase Amount (THB)' : 'กรอกยอดชำระเงินของลูกค้า (บาท)'}
                    </p>
                  </div>
                  {earnRate > 1 && (
                    <div className="flex justify-center mb-2">
                       <span className="text-[9px] font-black tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                         Rate: {earnRate} {locale === 'en' ? 'THB' : 'บาท'} = 1 {locale === 'en' ? 'PT' : 'แต้ม'}
                       </span>
                    </div>
                  )}`;

code = code.replace(target3, replacement3);

fs.writeFileSync(filePath, code);
