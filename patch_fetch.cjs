const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace simple await res.json() with content type checking
  // This is a bit complex with regex, let's use a simpler string replace for AdminLogin.tsx specifically
  
  if (filePath.includes('AdminLogin.tsx')) {
    content = content.replace(
      "const data = await res.json();\n      if (!res.ok) {\n        throw new Error(data.error || 'Access denied');\n      }",
      `const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error('Server returned an invalid response (not JSON). Is the backend running?');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Access denied');
      }`
    );
    
    content = content.replace(
      "const data = await res.json();\n      if (!res.ok) {\n        throw new Error(data.error || 'Verification failed');\n      }",
      `const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response (not JSON).');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }`
    );
  }
  
  fs.writeFileSync(filePath, content);
}

patchFile('src/components/admin/AdminLogin.tsx');
console.log('patched');
