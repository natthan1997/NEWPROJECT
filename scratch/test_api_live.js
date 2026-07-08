const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('https://xylem-landscape.vercel.app/api/liff/member/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineUserId: 'test-line-id' })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
