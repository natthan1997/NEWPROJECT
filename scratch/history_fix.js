import fs from 'fs';

const filePath = 'components/pos/POSHistory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `            className="flex items-center gap-2 border border-[#F0F0E8] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-black hover:text-white disabled:opacity-50"
          >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {locale === 'en' ? 'Refresh' : locale === 'zh' ? '刷新' : '           รีเฟรช         '}</button>
      </header>`;

const replacement = `            className="flex items-center gap-2 border border-[#F0F0E8] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-black hover:text-white disabled:opacity-50"
          >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {locale === 'en' ? 'Refresh' : locale === 'zh' ? '刷新' : '           รีเฟรช         '}</button>
        </div>
      </header>`;

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content);
console.log('fixed div');
