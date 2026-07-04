import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Header replacement
const headerTarget = `                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center">สถานะ</th>`;
const headerReplacement = `                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[100px] text-center">ตัวเลือก</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center">สถานะ</th>`;
content = content.replace(headerTarget, headerReplacement);

// Data replacement
const dataTarget = `                                                    {/* Status Column */}`;
const dataReplacement = `                                                    {/* Options Column */}
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-wrap gap-1 justify-center max-w-[160px] mx-auto">
                                                            {allModifierGroups.map(group => {
                                                                const active = (item.modifiers || []).some((modifier: any) => modifier.group_id === group.id)
                                                                return (
                                                                    <button
                                                                        key={group.id}
                                                                        type="button"
                                                                        onClick={() => handleModifierGroupToggle(item.id, group.id)}
                                                                        className={\`px-2 py-1 text-[9px] font-bold tracking-wider rounded transition-all \${
                                                                            active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                        }\`}
                                                                    >
                                                                        {group.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>

                                                    {/* Status Column */}`;
content = content.replace(dataTarget, dataReplacement);

fs.writeFileSync(filePath, content);
console.log('Added options column');
