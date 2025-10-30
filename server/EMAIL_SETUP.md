# Email Setup Guide for Password Reset

## ✅ Email functionality has been added!

The system now sends real password reset emails using Gmail.

## Setup Instructions

### 1. Generate Gmail App Password

Since Gmail requires 2-factor authentication for app access, you need to create an **App Password**:

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select **Mail** and **Other (Custom name)**
6. Enter "Classmates Social" as the name
7. Click **Generate**
8. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### 2. Add Credentials to .env File

Open your `.env` file in the `server` folder and add:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
CLIENT_URL=http://localhost:5173
```

**Important:** Use the **App Password**, NOT your regular Gmail password!

### 3. Restart Your Server

```bash
npm start
```

## How It Works

1. User enters their email on the "Forgot Password" page
2. Server generates a secure reset token
3. **Email is sent** with a reset link (valid for 1 hour)
4. User clicks the link and sets a new password

## Fallback Behavior

If email credentials are not configured:
- The system will still work
- Reset link will be printed in the server console
- You can copy/paste the link manually

## Testing

1. Go to http://localhost:5173/forgot-password
2. Enter a valid user email
3. Check your email inbox (or spam folder)
4. Click the reset link
5. Set a new password

## Troubleshooting

**Email not received?**
- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_PASS in .env
- Make sure you're using an App Password, not regular password
- Check server console for error messages

**"Less secure app access" error?**
- Use App Password instead (see step 1 above)
- Gmail no longer supports "less secure apps"

## Production Deployment

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, pay-as-you-go)

These services are more reliable than Gmail for production use.
