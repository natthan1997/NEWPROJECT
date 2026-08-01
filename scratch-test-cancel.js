require('dotenv').config({ path: '.env.local' });

async function testCancel() {
  try {
    const res = await fetch('https://xylstudio.com/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '057dfc61-a26a-4a70-b4ff-49cd200135d3', reason: 'Test cancel script' })
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (err) {
    console.error(err);
  }
}
testCancel();
