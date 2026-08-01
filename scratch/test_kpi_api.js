const start = Date.now()
fetch('http://localhost:3000/api/staff/gamification-kpi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profileId: 'some-id', branchCode: 'B001' })
}).then(async r => {
  console.log('Status:', r.status)
  console.log('Data:', await r.text())
  console.log('Time taken:', Date.now() - start, 'ms')
}).catch(e => {
  console.log('Error:', e)
  console.log('Time taken:', Date.now() - start, 'ms')
})
