const fs = require('fs');
const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Patch executeNativePrint loop
const executePrintTarget = `        for (const printer of targetPrinters) {
            if (!printer.ip) continue;
            
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
        }`;

const executePrintReplacement = `        const printJobs = targetPrinters.map(async (printer: any) => {
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

if (content.includes(executePrintTarget)) {
  content = content.replace(executePrintTarget, executePrintReplacement);
  console.log('Patched executeNativePrint loop');
} else {
  console.log('executePrintTarget not found');
}


// 2. Patch handleProcessPayment drawer loop
const drawerTarget = `          if (method === 'cash') {
            const receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
            for (const rp of receiptPrinters) {
               if (!rp.ip) continue;
               await printOpenDrawer(rp.ip)
            }
            // Fallback: if no printers in settings, try localStorage IP
            if (receiptPrinters.length === 0) {
              const fallbackIp = typeof window !== 'undefined' ? localStorage.getItem('rushup_printer_ip') : null
              if (fallbackIp) await printOpenDrawer(fallbackIp)
            }
          }`;

const drawerReplacement = `          if (method === 'cash') {
            const receiptPrinters = printers.filter((p: any) => p.type === 'receipt' || p.type === 'both')
            if (receiptPrinters.length > 0) {
              Promise.allSettled(receiptPrinters.map(rp => rp.ip ? printOpenDrawer(rp.ip) : Promise.resolve())).catch(console.error);
            } else {
              const fallbackIp = typeof window !== 'undefined' ? localStorage.getItem('rushup_printer_ip') : null
              if (fallbackIp) printOpenDrawer(fallbackIp).catch(console.error);
            }
          }`;

if (content.includes(drawerTarget)) {
  content = content.replace(drawerTarget, drawerReplacement);
  console.log('Patched cash drawer loop');
} else {
  console.log('drawerTarget not found');
}

fs.writeFileSync(filePath, content, 'utf8');
