const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '..', 'app', 'dashboard', 'staff', 'profile', 'page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// The card starts with <div className="bg-white p-6 rounded-2xl border border-purple-100/50...">
// and contains "โควตาวันหยุดชดเชยสะสม". Let's locate it and remove it.

const startStr = `<div className="bg-white p-6 rounded-2xl border border-purple-100/50 shadow-sm relative overflow-hidden">`;
const endStr = `</div>
                                        </div>
                                    </div>`;

const startIndex = content.indexOf(startStr);
if (startIndex !== -1) {
    // Find where the card ends by looking for the next big block or just manually mapping the lines.
    // The previous search showed Line 741 has "โควตาวันหยุดชดเชยสะสม"
}
