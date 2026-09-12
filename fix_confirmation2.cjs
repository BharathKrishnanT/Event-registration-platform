const fs = require('fs');

let code = fs.readFileSync('src/components/public/PublicConfirmationPage.tsx', 'utf8');

// 1. Add CheckCircle to lucide-react imports if not there
if (!code.includes('CheckCircle')) {
  code = code.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*'lucide-react';/, (match, group1) => {
    if (group1.includes('CheckCircle')) return match;
    return `import { ${group1}, CheckCircle } from 'lucide-react';`;
  });
}

// 2. Add missing functions right before `  return (`
const returnRegex = /  return \(/;
const functionsToAdd = `
  const handlePrint = () => {
    setShowPrintModal(true);
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print failed', err);
      }
    }, 500);
  };

  const handleDownloadPass = async () => {
    if (!qrPassUrl) return;
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = qrPassUrl;
      a.download = \`Pass-\${reg.registration_number}.png\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  `;

code = code.replace(returnRegex, functionsToAdd + '  return (');

fs.writeFileSync('src/components/public/PublicConfirmationPage.tsx', code);
console.log("Fixed functions");
