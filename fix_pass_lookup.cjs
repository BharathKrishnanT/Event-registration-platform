const fs = require('fs');
let code = fs.readFileSync('src/components/public/PassLookupModal.tsx', 'utf8');

code = code.replace(/bg-slate-900\/60 backdrop-blur-xs/g, "bg-gray-900/50 backdrop-blur-sm");
code = code.replace(/rounded-2xl shadow-2xl border border-slate-200/g, "rounded-lg shadow-xl border border-gray-200");
code = code.replace(/px-3\.5 py-2\.5 rounded-xl border border-slate-300/g, "px-3 py-2 border border-gray-300 rounded-md shadow-sm");
code = code.replace(/rounded-xl/g, "rounded-md");
code = code.replace(/bg-slate-900/g, "bg-gray-900");
code = code.replace(/bg-slate-800/g, "bg-gray-800");

fs.writeFileSync('src/components/public/PassLookupModal.tsx', code);
console.log("Fixed PassLookupModal");
