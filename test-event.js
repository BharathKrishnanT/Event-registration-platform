async function test() {
  const fetch = require('node-fetch');
  
  const res = await fetch('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' },
    body: JSON.stringify({
      name: 'Test Event',
      club_id: 'club-demo-2026',
      form_fields: [{ field_name: 'test', label: 'Test', field_type: 'text', is_required: true }]
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}
test();
