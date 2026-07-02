const pendingItem = { sale_price: 45 }
const tempSelectedModifiers = [
  { id: 1, price_adjustment: 10, qty: 2 }
]
const totalPrice = (pendingItem.sale_price || 0) + tempSelectedModifiers.reduce((acc, m) => acc + ((m.price_adjustment || m.price || 0) * (m.qty || 1)), 0)
console.log(totalPrice)
