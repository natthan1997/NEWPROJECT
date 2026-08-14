const fs = require('fs');
const path = '/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the bill discount wrapper
content = content.replace(
  '{showBillDiscountModal ? (\n          <div className="flex h-full w-full flex-col bg-white">',
  `<AnimatePresence mode="wait">
        {showBillDiscountModal ? (
          <motion.div
            key="bill-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
          >`
);

content = content.replace(
  '</footer>\n          </div>\n        ) : itemDiscountModalItem ? (\n          <div className="flex h-full w-full flex-col bg-white">',
  `</footer>
          </motion.div>
        ) : itemDiscountModalItem ? (
          <motion.div
            key="item-discount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
          >`
);

content = content.replace(
  '</footer>\n          </div>\n        ) : (\n          <div className="flex h-full w-full flex-col">',
  `</footer>
          </motion.div>
        ) : (
          <motion.div
            key="cart-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-col bg-white absolute inset-0"
          >`
);

content = content.replace(
  '</button>\n                )}\n              </div>\n            </footer>\n          </div>\n        )}',
  `</button>
                )}
              </div>
            </footer>
          </motion.div>
        )}
        </AnimatePresence>`
);

fs.writeFileSync(path, content);
console.log("Animation added");
