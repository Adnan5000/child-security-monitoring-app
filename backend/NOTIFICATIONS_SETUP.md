# Notification Setup Guide

This guide explains how to configure SMS and email notifications for emergency alerts.

## Overview

The system supports two types of notifications:
- **SMS** via Twilio
- **Email** via SendGrid

Both services are optional and can be enabled independently.

## SMS Notifications (Twilio)

### Step 1: Create Twilio Account
1. Sign up at https://www.twilio.com/try-twilio
2. Verify your phone number
3. Get a Twilio phone number (free trial numbers available)

### Step 2: Get Credentials
1. Go to https://www.twilio.com/console
2. Find your **Account SID** and **Auth Token**
3. Note your Twilio phone number (format: +1234567890)

### Step 3: Configure Environment Variables
Add to your `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_NOTIFICATIONS=true
```

### Step 4: Test
- Create a test alert and verify SMS is received
- Check backend logs for delivery status

## Email Notifications (SendGrid)

### Step 1: Create SendGrid Account
1. Sign up at https://signup.sendgrid.com/
2. Verify your email address
3. Complete account setup

### Step 2: Create API Key
1. Go to https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name it (e.g., "Child Security Alerts")
4. Select "Full Access" or "Restricted Access" with Mail Send permissions
5. Copy the API key (you'll only see it once!)

### Step 3: Verify Sender Email (Optional but Recommended)
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Verify a single sender or set up domain authentication
3. Use verified email as `SENDGRID_FROM_EMAIL`

### Step 4: Configure Environment Variables
Add to your `.env` file:

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=alerts@yourdomain.com
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Step 5: Test
- Create a test alert and verify email is received
- Check spam folder if email doesn't arrive
- Check backend logs for delivery status

## Configuration Options

### Enable/Disable Notifications
You can enable or disable each notification type independently:

```env
ENABLE_SMS_NOTIFICATIONS=true   # or false
ENABLE_EMAIL_NOTIFICATIONS=true  # or false
```

### Notification Priority
Emergency contacts are notified in priority order (lower number = notified first):
- Contacts with priority 1 are notified first
- Contacts with priority 2 are notified second
- And so on...

## How It Works

1. **Alert Created**: When an alert is triggered (SOS button or shake detection)
2. **Background Task**: Notification sending happens in background (non-blocking)
3. **Contact Selection**: All emergency contacts for the parent are notified
4. **Delivery Methods**: 
   - SMS sent to phone_number (if available)
   - Email sent to email (if available)
5. **Status Update**: Alert status changes from PENDING → SENT when at least one notification succeeds

## Notification Message Format

Both SMS and email include:
- Child's name
- Alert type (SOS Button or Shake Trigger)
- Timestamp
- Location (if available)
- Alert message/details

## Troubleshooting

### SMS Not Working
- Verify Twilio credentials are correct
- Check Twilio account has sufficient credits
- Verify phone numbers are in E.164 format (+1234567890)
- Check backend logs for error messages

### Email Not Working
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Check spam/junk folder
- Verify recipient email addresses are valid
- Check SendGrid activity feed: https://app.sendgrid.com/activity

### Notifications Not Sending
- Check `ENABLE_SMS_NOTIFICATIONS` and `ENABLE_EMAIL_NOTIFICATIONS` are set to `true`
- Verify emergency contacts have phone numbers (for SMS) or emails (for email)
- Check backend logs for initialization messages on startup
- Ensure background tasks are running (check FastAPI logs)

## Cost Considerations

### Twilio
- Free trial: $15.50 credit
- Pay-as-you-go: ~$0.0075 per SMS (varies by country)
- See https://www.twilio.com/sms/pricing

### SendGrid
- Free tier: 100 emails/day forever
- Paid plans start at $19.95/month for 50,000 emails
- See https://sendgrid.com/pricing/

## Security Notes

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment-specific credentials (dev/staging/prod)
- Monitor usage to detect abuse

## Testing Without Real Services

For development/testing without real SMS/email:
1. Leave `ENABLE_SMS_NOTIFICATIONS=false` and `ENABLE_EMAIL_NOTIFICATIONS=false`
2. Alerts will still be created and stored
3. Check alert status in dashboard (will remain PENDING)
4. Use Twilio/SendGrid test credentials for integration testing

