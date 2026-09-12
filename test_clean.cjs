function cleanEnv(val, keyName) {
  if (!val) return '';
  let cleaned = val.trim();
  const prefixRegex = new RegExp('^' + keyName + '[\\s=]*', 'i');
  cleaned = cleaned.replace(prefixRegex, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned.trim();
}

console.log("HOST:", cleanEnv("SMTP_HOST smtp.gmail.com", "SMTP_HOST"));
console.log("PORT:", cleanEnv("SMTP_PORT 465", "SMTP_PORT"));
console.log("PASS:", cleanEnv(process.env.SMTP_PASS, "SMTP_PASS"));
