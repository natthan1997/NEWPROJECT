const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add state for results
const stateTarget = `  const [redeemPointsAmount, setRedeemPointsAmount] = useState<string>('')`;
const stateReplacement = `  const [redeemPointsAmount, setRedeemPointsAmount] = useState<string>('')
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([])`;
code = code.replace(stateTarget, stateReplacement);

// 2. Add useEffect for live search
const effectTarget = `  const handleSearchMemberFlow = async () => {`;
const effectReplacement = `  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (memberSearchQuery.trim().length >= 3) {
        setIsSearchingMember(true)
        try {
          const { data } = await supabase
            .from('pos_members')
            .select('*')
            .or(\`phone.ilike.%\${memberSearchQuery}%,full_name.ilike.%\${memberSearchQuery}%,display_name.ilike.%\${memberSearchQuery}%\`)
            .limit(5)
          if (data) {
            setMemberSearchResults(data)
          } else {
            setMemberSearchResults([])
          }
        } catch(e) {
          console.error(e)
        } finally {
          setIsSearchingMember(false)
        }
      } else {
        setMemberSearchResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [memberSearchQuery])

  const handleSearchMemberFlow = async () => {`;
code = code.replace(effectTarget, effectReplacement);

// 3. Update the UI to show dropdown
const uiTarget = `                   <input
                      type="text"
                      autoFocus
                      placeholder={locale === 'en' ? 'Phone Number...' : 'เบอร์โทรศัพท์...'}
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            handleSearchMemberFlow();
                         }
                      }}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-xl font-bold mb-4 focus:outline-none focus:border-black transition-all"
                   />
                   
                   <div className="flex gap-3">`;

const uiReplacement = `                   <div className="relative mb-4">
                     <input
                        type="text"
                        autoFocus
                        placeholder={locale === 'en' ? 'Phone Number or Name...' : 'เบอร์โทรศัพท์ หรือ ชื่อ...'}
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && memberSearchResults.length > 0) {
                              setSelectedCustomer(memberSearchResults[0]);
                              setMemberCheckoutStep('points');
                           } else if (e.key === 'Enter') {
                              handleSearchMemberFlow();
                           }
                        }}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-xl font-bold focus:outline-none focus:border-black transition-all"
                     />
                     {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 max-h-[250px] overflow-y-auto">
                           {memberSearchResults.map((m) => (
                              <button
                                 key={m.id}
                                 onClick={() => {
                                    setSelectedCustomer(m);
                                    setMemberCheckoutStep('points');
                                    setMemberSearchResults([]);
                                 }}
                                 className="w-full text-left px-6 py-4 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between transition-colors last:border-b-0"
                              >
                                 <div>
                                    <div className="font-bold text-gray-800">{m.full_name || m.display_name || 'No Name'}</div>
                                    <div className="text-sm text-gray-400 mt-1 font-mono">{m.phone}</div>
                                 </div>
                                 <div className="text-emerald-500 font-black flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                                    {m.points || 0} PTS
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                   </div>
                   
                   <div className="flex gap-3">`;

code = code.replace(uiTarget, uiReplacement);

// 4. Update the "handleSearchMemberFlow" to fallback to first result if available
const searchTarget = `      if (data) {
        setSelectedCustomer(data);
        setMemberCheckoutStep('points');
      } else {`;
const searchReplacement = `      if (memberSearchResults.length > 0) {
        setSelectedCustomer(memberSearchResults[0]);
        setMemberCheckoutStep('points');
      } else if (data) {
        setSelectedCustomer(data);
        setMemberCheckoutStep('points');
      } else {`;
code = code.replace(searchTarget, searchReplacement);


fs.writeFileSync(filePath, code);
