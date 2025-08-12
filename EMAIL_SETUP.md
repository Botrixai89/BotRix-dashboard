# Email Setup Guide for BotrixAI

This guide will help you configure email functionality for password resets, email verification, and welcome emails.

## Prerequisites

- A Gmail account (or other SMTP provider)
- App password for Gmail (if using 2FA)

## Gmail Setup

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### 2. Generate App Password
1. Go to Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "BotrixAI" as the name
6. Copy the generated 16-character password

### 3. Environment Variables

Add these variables to your `.env.local` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your_email@gmail.com
```

## Other SMTP Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
SMTP_FROM=your_email@outlook.com
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@yahoo.com
```

### Custom SMTP Server
```env
SMTP_HOST=your_smtp_server.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM=your_email@domain.com
```

## Testing Email Configuration

You can test your email configuration by:

1. Starting the development server: `npm run dev`
2. Going to the forgot password page
3. Entering your email address
4. Checking if you receive the password reset email

## Email Templates

The application includes three types of emails:

1. **Password Reset Email** - Sent when users request password reset
2. **Email Verification** - Sent for email verification (if implemented)
3. **Welcome Email** - Sent to new users (if implemented)

All emails use responsive HTML templates with the BotrixAI branding.

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure you're using an app password, not your regular password
   - Check if 2FA is enabled on your Gmail account

2. **Connection Timeout**
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Check your firewall settings

3. **Emails Not Sending**
   - Check the console logs for error messages
   - Verify all environment variables are set correctly

### Security Notes

- Never commit your `.env.local` file to version control
- Use app passwords instead of regular passwords
- Consider using environment-specific email configurations for production

## Production Considerations

For production deployment:

1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Set up proper SPF, DKIM, and DMARC records
3. Monitor email delivery rates
4. Implement email rate limiting
5. Use environment-specific SMTP configurations
