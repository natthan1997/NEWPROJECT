const extractFromStr = (str) => {
  if (!str) return null;
  let cur = str;
  for (let i = 0; i < 3; i++) {
    const match = cur.match(/(?:[?&]|%3F|%26)claimToken(?:=3D|=)([^&%]+)/i) || cur.match(/claimToken=([^&]+)/i);
    if (match && match[1]) return match[1];
    try {
      const dec = decodeURIComponent(cur);
      if (dec === cur) break;
      cur = dec;
    } catch {
      break;
    }
  }
  return null;
};

console.log('Test 1:', extractFromStr('?claimToken=abc123token&path=%2Fliff%2Fmember%3FclaimToken%3Dabc123token'));
console.log('Test 2:', extractFromStr('%3FclaimToken%3Dabc123token'));
console.log('Test 3:', extractFromStr('%2Fmember%3FclaimToken%3Dabc123token'));
