const net_total = 120;
const delivery_fee = 60;
const earnThb = 50;
const earnPts = 1;
const amountForPoints = net_total - delivery_fee;
const pointsToEarn = Math.floor(amountForPoints / earnThb) * earnPts;
console.log("Calculated points:", pointsToEarn, "from amount:", amountForPoints);
