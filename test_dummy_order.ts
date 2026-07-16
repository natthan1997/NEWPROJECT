export const dummyOrder = {
    orderNumber: 'Q-01',
    date: new Date().toLocaleString(),
    queueNumber: '01',
    orderType: 'dine_in',
    tableNumber: 'T-01',
    staffName: 'Demo Staff',
    total: 140,
    subtotal: 140,
    discount: 0,
    tax: 0,
    items: [
        {
            name: 'กาแฟลาเต้ (เย็น)',
            quantity: 1,
            subtotal: 140,
            modifiers: ['หวานน้อย 50%', 'เปลี่ยนนมโอ๊ต'],
            selected_modifiers: [
                { name: 'หวานน้อย 50%' },
                { name: 'เปลี่ยนนมโอ๊ต' }
            ]
        }
    ]
};
