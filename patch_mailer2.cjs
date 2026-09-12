const fs = require('fs');
let code = fs.readFileSync('server/mailer.ts', 'utf8');

code += `
export async function sendScreeningStatusEmail(to: string, eventName: string, teamName: string, status: 'shortlisted' | 'rejected') {
  const mailer = await getTransporter();
  
  const isShortlisted = status === 'shortlisted';
  const statusColor = isShortlisted ? '#10b981' : '#f43f5e';
  const statusTitle = isShortlisted ? 'Congratulations!' : 'Update on your Submission';
  
  let html = \`
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0;">\${eventName} - Screening Status</h2>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: \${statusColor}; margin-top: 0;">\${statusTitle}</h3>
        <p>Hi <strong>\${teamName}</strong>,</p>
        <p>Your screening status for <strong>\${eventName}</strong> has been updated.</p>
        
        \${isShortlisted 
          ? '<p>We are thrilled to inform you that your team has been <strong>Shortlisted</strong> for the next round! Please keep an eye out for further instructions from the organizing team.</p>' 
          : '<p>Unfortunately, your team was <strong>not shortlisted</strong> for the next round. We received many excellent submissions and had to make some tough choices. Thank you for participating!</p>'}
        
        <div style="margin: 32px 0; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    </div>
  \`;

  const info = await mailer.sendMail({
    from: '"Event Organizing Team" <noreply@events.local>',
    to,
    subject: \`Screening Status: \${eventName}\`,
    html,
  });

  console.log("Screening Status Email sent: %s", info.messageId);
  return info;
}
`;

fs.writeFileSync('server/mailer.ts', code);
console.log('Patched mailer2');
