const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('https://xylem-landscape.vercel.app/api/liff/member/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: 'd954b0c8-12e2-48bb-bda6-6fecc77a409b' })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
