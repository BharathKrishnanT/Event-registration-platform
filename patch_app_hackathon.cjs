const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = "import { HackathonScreeningView } from './components/admin/HackathonScreeningView.tsx';";
if (!code.includes("HackathonScreeningView")) {
  code = code.replace(
    "import { RegistrationsView } from './components/admin/RegistrationsView.tsx';",
    "import { RegistrationsView } from './components/admin/RegistrationsView.tsx';\n" + importStr
  );
}

const targetTab = `{adminTab === 'registrations' && (
              <RegistrationsView event={selectedEvent} currentUser={currentUser} />
            )}`;
            
const replaceTab = `{adminTab === 'registrations' && (
              <RegistrationsView event={selectedEvent} currentUser={currentUser} />
            )}
            {adminTab === 'hackathon' && (
              <HackathonScreeningView event={selectedEvent} currentUser={currentUser} />
            )}`;

if (code.includes(targetTab)) {
  code = code.replace(targetTab, replaceTab);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx with HackathonScreeningView");
} else {
  console.log("Could not find targetTab in App.tsx");
}
