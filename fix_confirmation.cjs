const fs = require('fs');

let code = fs.readFileSync('src/components/public/PublicConfirmationPage.tsx', 'utf8');

// The original file had a helper:
// const escapeHtml = (str: string) => {
//   return str.replace(/[&<>'"]/g, tag => ({
//     '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
//   }[tag]));
// };
// Let's replace the broken return

const badReturnIndex = code.indexOf('  const escapeHtml = (str: string) => {\n    return (');
if (badReturnIndex !== -1) {
    code = code.replace(/const escapeHtml = \(str: string\) => \{\s*return \(/, `const escapeHtml = (str: string) => {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  };
  return (`);
    fs.writeFileSync('src/components/public/PublicConfirmationPage.tsx', code);
    console.log("Fixed syntax error");
} else {
    console.log("Could not find the bad pattern to fix");
}
