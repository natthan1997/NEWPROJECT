const fs = require('fs');
let code = fs.readFileSync('components/pos/POSTerminal.tsx', 'utf8');

// Fix 1: executeNativePrint
const target1 = `        const printJobs = targetPrinters.map(async (printer: any) => {
            if (!printer.ip) return;
            try {
              if (type === 'receipt') {
                 if (printer.encoding === 'graphic') {
                     const { printGraphicModeCustomerReceipt } = await import('@/lib/graphicPrinter');
                     await printGraphicModeCustomerReceipt(printer.ip, printOrderData, printShopData, printer.model, printer.encoding, openDrawer);
                 } else {
                     await printCustomerReceipt(printer.ip, printOrderData, printShopData, printer.model, printer.encoding, openDrawer);
                 }
              } else {
                 let itemsToPrint = printOrderData.items;
                 const printerCats = printer.categories || [];
                 
                 if (!printerCats.includes('all') && printerCats.length > 0) {
                    itemsToPrint = printOrderData.items.filter((i: any) => printerCats.includes(i.category_id));
                 }
                 
                 if (itemsToPrint.length > 0) {
                    const routedOrderData = { ...printOrderData, items: itemsToPrint };
                    if (printer.encoding === 'graphic') {
                        const { printGraphicModeKitchenTicket } = await import('@/lib/graphicPrinter');
                        await printGraphicModeKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                    } else {
                        await printKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                    }
                 }
              }
            } catch (err) {
              console.error('Printer job failed for', printer.ip, err);
            }
        });
        await Promise.allSettled(printJobs);`;

const replace1 = `        const printJobs = targetPrinters.map(async (printer: any) => {
            if (!printer.ip) return;
            if (type === 'receipt') {
               if (printer.encoding === 'graphic') {
                   const { printGraphicModeCustomerReceipt } = await import('@/lib/graphicPrinter');
                   await printGraphicModeCustomerReceipt(printer.ip, printOrderData, printShopData, printer.model, printer.encoding, openDrawer);
               } else {
                   await printCustomerReceipt(printer.ip, printOrderData, printShopData, printer.model, printer.encoding, openDrawer);
               }
            } else {
               let itemsToPrint = printOrderData.items;
               const printerCats = printer.categories || [];
               
               if (!printerCats.includes('all') && printerCats.length > 0) {
                  itemsToPrint = printOrderData.items.filter((i: any) => printerCats.includes(i.category_id));
               }
               
               if (itemsToPrint.length > 0) {
                  const routedOrderData = { ...printOrderData, items: itemsToPrint };
                  if (printer.encoding === 'graphic') {
                      const { printGraphicModeKitchenTicket } = await import('@/lib/graphicPrinter');
                      await printGraphicModeKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                  } else {
                      await printKitchenTicket(printer.ip, routedOrderData, printShopData, printer.model, printer.encoding);
                  }
               }
            }
        });
        const results = await Promise.allSettled(printJobs);
        const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason?.message || r.reason);
        if (errors.length > 0) {
           throw new Error(errors.join(', '));
        }`;

code = code.replace(target1, replace1);

// Fix 2: printOpenDrawer
const target2 = `Promise.allSettled(receiptPrinters.map(rp => rp.ip ? printOpenDrawer(rp.ip) : Promise.resolve())).catch(console.error);`;
const replace2 = `Promise.all(receiptPrinters.map(rp => rp.ip ? printOpenDrawer(rp.ip) : Promise.resolve())).catch(console.error);`;

code = code.replace(target2, replace2);

fs.writeFileSync('components/pos/POSTerminal.tsx', code, 'utf8');
console.log("Fixed printer error swallowing");
