const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handleAdminLoginSuccess and handleAdminLogout
appCode = appCode.replace(
  "document.cookie = `organizer_email=${encodeURIComponent(currentUser.email)}; path=/; SameSite=Lax`;",
  ""
);
appCode = appCode.replace(
  "document.cookie = 'organizer_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';",
  ""
);
appCode = appCode.replace(
  "sessionStorage.setItem('event_admin_token', token);",
  ""
);
appCode = appCode.replace(
  "sessionStorage.removeItem('event_admin_token');",
  "fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);"
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('patched app frontend');
