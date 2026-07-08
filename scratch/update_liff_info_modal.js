const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

// Update modal content to have two sections: Benefits and Title Catalog
const searchModal = `{/* How to earn */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-2">{dict.howToEarn}</h4>
                  <p className="text-[16px] font-medium text-gray-900">{dict.earnRule}</p>
                </div>

                {/* Tiers List */}
                <div className="space-y-6">
                  {tiers.map((tier) => (`;

const replaceModal = `{/* Benefits Section */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-3 uppercase tracking-wider font-semibold">สิทธิประโยชน์สมาชิก</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <Gift size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">{dict.howToEarn}</p>
                        <p className="text-[13px] text-gray-500">{dict.earnRule}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-900">สะสมฉายาสุดเท่</p>
                        <p className="text-[13px] text-gray-500">ทำภารกิจลับเพื่อปลดล็อกฉายาพิเศษ</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Title Catalog */}
                <div>
                  <h4 className="text-[13px] text-gray-500 mb-4 uppercase tracking-wider font-semibold">แคตตาล็อคฉายา</h4>
                  <div className="space-y-4">
                    {tiers.map((tier) => (`;

c = c.replace(searchModal, replaceModal);

// We need to fix the closing tags since we added `<div className="space-y-4">` and a parent `<div>`.
const searchEnd = `))}
                </div>

              </div>`;

const replaceEnd = `))}
                  </div>
                </div>

              </div>`;

c = c.replace(searchEnd, replaceEnd);

fs.writeFileSync(target, c);
console.log('Updated LIFF Info Modal');
