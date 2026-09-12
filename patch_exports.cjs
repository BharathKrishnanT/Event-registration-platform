const fs = require('fs');

let apiCode = fs.readFileSync('server/routes/api.ts', 'utf8');

const excelRegex = /const regData = regs\.map\(r => \{[\s\S]*?Registered At': r\.created_at,\n    \};\n  \}\);/;

const newExcelCode = `const regData = regs.map((r, index) => {
    let teamMembersNames = r.name;
    let teamMembersDetails = \`\${r.name} (Leader) - \${r.phone} - \${r.email} - [\${r.attendance_status}]\`;
    
    if (r.team_members && r.team_members.length > 0) {
      teamMembersNames += ', ' + r.team_members.map(m => m.name).join(', ');
      teamMembersDetails += ' | ' + r.team_members.map(m => \`\${m.name} - \${m.phone || 'N/A'} - [\${m.checked_in ? 'In' : 'Out'}]\`).join(' | ');
    }
    
    return {
      'S.No': index + 1,
      'Team ID': r.registration_number,
      'Team Name': r.team_name || 'N/A',
      'Members': teamMembersNames,
      'Members Details': teamMembersDetails,
      'College': r.college,
      'Department': r.department,
      'Transaction ID': r.transaction_id || 'N/A',
      'Payment Status': r.payment_status,
      'Registration Status': r.registration_status,
      'Registered At': r.created_at,
    };
  });`;

apiCode = apiCode.replace(excelRegex, newExcelCode);

const csvRegex = /const headers = \['Registration ID'[\s\S]*?\];\n  \}\);/;

const newCsvCode = `const headers = ['S.No', 'Team ID', 'Team Name', 'Members', 'Members Details', 'College', 'Department', 'Transaction ID', 'Payment Status', 'Registration Status', 'Registered At'];
  const rows = regs.map((r, index) => {
    let teamMembersNames = r.name;
    let teamMembersDetails = \`\${r.name} (Leader) - \${r.phone} - \${r.email} - [\${r.attendance_status}]\`;
    
    if (r.team_members && r.team_members.length > 0) {
      teamMembersNames += ', ' + r.team_members.map(m => m.name).join(', ');
      teamMembersDetails += ' | ' + r.team_members.map(m => \`\${m.name} - \${m.phone || 'N/A'} - [\${m.checked_in ? 'In' : 'Out'}]\`).join(' | ');
    }

    return [
      index + 1,
      \`"\${r.registration_number}"\`,
      \`"\${(r.team_name || 'N/A').replace(/"/g, '""')}"\`,
      \`"\${teamMembersNames.replace(/"/g, '""')}"\`,
      \`"\${teamMembersDetails.replace(/"/g, '""')}"\`,
      \`"\${r.college.replace(/"/g, '""')}"\`,
      \`"\${r.department.replace(/"/g, '""')}"\`,
      \`"\${r.transaction_id || ''}"\`,
      r.payment_status,
      r.registration_status,
      \`"\${r.created_at}"\`
    ];
  });`;

apiCode = apiCode.replace(csvRegex, newCsvCode);

fs.writeFileSync('server/routes/api.ts', apiCode);
console.log('Patched exports');
