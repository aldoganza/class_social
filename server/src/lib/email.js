const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass, // Use App Password, not regular password
    },
  });

  return transporter;
}

async function sendPasswordResetEmail(to, resetUrl, userName) {
  const transport = getTransporter();
  
  if (!transport) {
    console.log('\n=== PASSWORD RESET LINK (Email not configured) ===');
    console.log(`User: ${userName} (${to})`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('===================================================\n');
    return { success: false, reason: 'Email not configured' };
  }

  const mailOptions = {
    from: `"Classmates Social" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Reset Your Password - Classmates Social',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Classmates Social</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName || 'there'}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Classmates Social. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${userName || 'there'}!

We received a request to reset your password.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Classmates Social
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('✗ Failed to send email:', error.message);
    // Fallback: log the URL
    console.log('\n=== PASSWORD RESET LINK (Email failed) ===');
    console.log(`User: ${userName} (${to})`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('==========================================\n');
    return { success: false, reason: error.message };
  }
}

module.exports = { sendPasswordResetEmail };
