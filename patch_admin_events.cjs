const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EventsManagementView.tsx', 'utf8');

// Replace eventType dropdowns
const dropdownRegex = /<select\s+value=\{eventType\}\s+onChange=\{\(e\) => setEventType\(e\.target\.value as any\)\}\s+className="[^"]*"\s*>\s*<option value="solo">Solo Event<\/option>\s*<option value="team">Team Event<\/option>\s*<\/select>/g;
code = code.replace(dropdownRegex, `
<select
  value={eventType}
  onChange={(e) => setEventType(e.target.value as any)}
  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
>
  <option value="solo">Solo Event</option>
  <option value="team">Team Event</option>
  <option value="hackathon">Hackathon (Team + Document)</option>
</select>`);

const dropdownRegexEdit = /<select\s+value=\{editEventType\}\s+onChange=\{\(e\) => setEditEventType\(e\.target\.value as any\)\}\s+className="[^"]*"\s*>\s*<option value="solo">Solo Event<\/option>\s*<option value="team">Team Event<\/option>\s*<\/select>/g;
code = code.replace(dropdownRegexEdit, `
<select
  value={editEventType}
  onChange={(e) => setEditEventType(e.target.value as any)}
  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
>
  <option value="solo">Solo Event</option>
  <option value="team">Team Event</option>
  <option value="hackathon">Hackathon (Team + Document)</option>
</select>`);

// Fix conditional team size
code = code.replace("eventType === 'team' ? minTeamSize : undefined", "(eventType === 'team' || eventType === 'hackathon') ? minTeamSize : undefined");
code = code.replace("eventType === 'team' ? maxTeamSize : undefined", "(eventType === 'team' || eventType === 'hackathon') ? maxTeamSize : undefined");
code = code.replace("editEventType === 'team' ? editMinTeamSize : undefined", "(editEventType === 'team' || editEventType === 'hackathon') ? editMinTeamSize : undefined");
code = code.replace("editEventType === 'team' ? editMaxTeamSize : undefined", "(editEventType === 'team' || editEventType === 'hackathon') ? editMaxTeamSize : undefined");

code = code.replace("eventType === 'team' && (", "(eventType === 'team' || eventType === 'hackathon') && (");
code = code.replace("editEventType === 'team' && (", "(editEventType === 'team' || editEventType === 'hackathon') && (");

fs.writeFileSync('src/components/admin/EventsManagementView.tsx', code);
console.log('Patched events admin view');
