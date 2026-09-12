async function test() {
  const res = await fetch('http://localhost:3000/api/events/evt-1789108408725', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' },
    body: JSON.stringify({
      form_fields: [{ field_name: 'test2', label: 'Test 2', field_type: 'text', is_required: true }]
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response form fields length:', data.form_fields?.length);
}
test();
