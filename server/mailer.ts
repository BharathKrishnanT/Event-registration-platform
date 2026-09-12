import * as nodemailer from 'nodemailer';

function cleanEnv(val, keyName) {
  if (!val) return '';
  let cleaned = val.trim();
  const prefixRegex = new RegExp('^' + keyName + '[\\s=]*', 'i');
  cleaned = cleaned.replace(prefixRegex, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned.trim();
}


let transporter: nodemailer.Transporter | null = null;

export async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const host = cleanEnv(process.env.SMTP_HOST, 'SMTP_HOST');
    const portStr = cleanEnv(process.env.SMTP_PORT, 'SMTP_PORT');
    const secureStr = cleanEnv(process.env.SMTP_SECURE, 'SMTP_SECURE');
    const user = cleanEnv(process.env.SMTP_USER, 'SMTP_USER');
    const pass = cleanEnv(process.env.SMTP_PASS, 'SMTP_PASS');
    
    transporter = nodemailer.createTransport({
      host: host,
      port: Number(portStr) || 587,
      secure: secureStr === 'true',
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables must be configured to send real emails. Please add them in the Secrets menu.");
  }

  return transporter;
}

export async function sendOTP(to: string, code: string) {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: `"Event Registration" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<b>Your verification code is:</b> <h2>${code}</h2>`,
  });

  console.log("OTP Email sent: %s", info.messageId);
  
  return { info };
}


export async function sendRegistrationConfirmation(to: string, eventName: string, regDetails: any, qrCodeDataUrl: string) {
  const mailer = await getTransporter();
  
  // Extract base64 part
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
  
  let html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0;">Registration Confirmed!</h2>
        <p style="margin: 8px 0 0; color: #cbd5e1;">${eventName}</p>
      </div>
      <div style="padding: 24px;">
        <p>Hi ${regDetails.name},</p>
        <p>Thank you for registering for <strong>${eventName}</strong>. Your registration details have been received successfully.</p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Registration Details</h3>
          <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${regDetails.registration_number}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${regDetails.registration_status}</p>
          <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${regDetails.payment_status}</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 12px;">Your Entry Pass (QR Code)</p>
          <img src="cid:qr-code" alt="QR Code Pass" style="width: 250px; height: 250px; border-radius: 12px; border: 2px solid #e2e8f0; display: inline-block;" />
          <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">Please present this QR code at the entrance for check-in.</p>
        </div>
      </div>
    </div>
  `;

  const info = await mailer.sendMail({
    from: `"Event Registration" <${process.env.SMTP_USER}>`,
    to,
    subject: `Registration Confirmed - ${eventName}`,
    html,
    attachments: [
      {
        filename: 'qr-pass.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qr-code'
      }
    ]
  });

  console.log("Confirmation Email sent: %s", info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  
  return info;
}

export async function sendScreeningStatusEmail(to: string, eventName: string, teamName: string, status: 'shortlisted' | 'rejected') {
  const mailer = await getTransporter();
  
  const isShortlisted = status === 'shortlisted';
  const statusColor = isShortlisted ? '#10b981' : '#f43f5e';
  const statusTitle = isShortlisted ? 'Congratulations!' : 'Update on your Submission';
  
  let html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0;">${eventName} - Screening Status</h2>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: ${statusColor}; margin-top: 0;">${statusTitle}</h3>
        <p>Hi <strong>${teamName}</strong>,</p>
        <p>Your screening status for <strong>${eventName}</strong> has been updated.</p>
        
        ${isShortlisted 
          ? '<p>We are thrilled to inform you that your team has been <strong>Shortlisted</strong> for the next round! Please keep an eye out for further instructions from the organizing team.</p>' 
          : '<p>Unfortunately, your team was <strong>not shortlisted</strong> for the next round. We received many excellent submissions and had to make some tough choices. Thank you for participating!</p>'}
        
        <div style="margin: 32px 0; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated message. Please do not reply directly to this email.
        </div>
      </div>
    </div>
  `;

  const info = await mailer.sendMail({
    from: `"Event Organizing Team" <${process.env.SMTP_USER}>`,
    to,
    subject: `Screening Status: ${eventName}`,
    html,
  });

  console.log("Screening Status Email sent: %s", info.messageId);
  return info;
}

export async function sendCustomBroadcastEmail(to: string, subject: string, htmlContent: string) {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: `"Event Organizing Team" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
  console.log("Broadcast Email sent: %s", info.messageId);
  return info;
}

export async function sendEventReminderEmail(to: string, eventName: string, regDetails: any, qrCodeDataUrl: string) {
  const mailer = await getTransporter();
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
  
  let html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0;">Event Reminder</h2>
        <p style="margin: 8px 0 0; color: #cbd5e1;">${eventName}</p>
      </div>
      <div style="padding: 24px;">
        <p>Hi ${regDetails.name},</p>
        <p>This is a quick reminder that <strong>${eventName}</strong> is happening soon! We can't wait to see you there.</p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b;">Registration Details</h3>
          <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${regDetails.registration_number}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${regDetails.registration_status}</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 12px;">Your Entry Pass (QR Code)</p>
          <img src="cid:qr-code" alt="QR Code Pass" style="width: 250px; height: 250px; border-radius: 12px; border: 2px solid #e2e8f0; display: inline-block;" />
          <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">Please present this QR code at the entrance for check-in.</p>
        </div>
      </div>
    </div>
  `;
  const info = await mailer.sendMail({
    from: `"Event Organizing Team" <${process.env.SMTP_USER}>`,
    to,
    subject: `Reminder: ${eventName} is approaching!`,
    html,
    attachments: [
      {
        filename: 'qr-pass.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qr-code'
      }
    ]
  });
  console.log("Reminder Email sent: %s", info.messageId);
  return info;
}
