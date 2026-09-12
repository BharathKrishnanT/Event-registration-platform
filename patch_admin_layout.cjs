const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

// Replace Sparkles with ShieldAlert
code = code.replace(
  "import { \n  Users, \n  Settings, \n  LayoutDashboard, \n  QrCode, \n  CalendarDays, \n  LogOut, \n  ChevronDown, \n  Table2, \n  CreditCard, \n  ShieldCheck,\n  Sparkles,\n  UserCog,\n  ListChecks,\n  ExternalLink,\n  FileSpreadsheet,\n  Activity\n} from 'lucide-react';",
  "import { \n  Users, \n  Settings, \n  LayoutDashboard, \n  QrCode, \n  CalendarDays, \n  LogOut, \n  ChevronDown, \n  Table2, \n  CreditCard, \n  ShieldCheck,\n  ShieldAlert,\n  UserCog,\n  ListChecks,\n  ExternalLink,\n  FileSpreadsheet,\n  Activity\n} from 'lucide-react';"
);

// Update super admin badge style
code = code.replace(
  "isSuperAdmin\n                    ? 'bg-purple-900/40 text-purple-300 border-purple-700/60 hover:bg-purple-900/60'\n                    : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'",
  "isSuperAdmin\n                    ? 'bg-amber-900/40 text-amber-300 border-amber-700/60 hover:bg-amber-900/60'\n                    : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'"
);

// Replace Sparkles icon
code = code.replace(
  "<Sparkles className=\"w-3.5 h-3.5 text-purple-400\" />",
  "<ShieldAlert className=\"w-3.5 h-3.5 text-amber-400\" />"
);

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);
console.log('patched admin layout');
