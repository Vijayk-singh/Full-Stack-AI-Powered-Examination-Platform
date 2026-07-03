const jwt = require('jsonwebtoken');
const fs = require('fs');

const token = jwt.sign({ userId: '123', email: 'test@test.com', role: 'TEACHER' }, 'super-secret-access-token-key-change-in-production-123456', { expiresIn: '2h' });

async function run() {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream('package.json'));

  const fetch = (await import('node-fetch')).default;

  const res = await fetch('http://localhost:3002/api/ai/analyze-pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders()
    },
    body: form
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
run().catch(console.error);
