# Pro-Level Notifications - Setup Guide

## 🎯 Overview
This guide will help you complete the setup for the notification system.

---

## 1. Database Migration

Run this SQL in your Supabase SQL Editor:

**File:** [`Complete Migration codes/Notification Infrastructure Migration.sql`](file:///Users/ashutoshsingh/Downloads/Mentra/Complete%20Migration%20codes/Notification%20Infrastructure%20Migration.sql)

---

## 2. Generate VAPID Keys

Run the following command to generate Web Push VAPID keys:

```bash
node scripts/generate-vapid-keys.js
```

Copy the output and add to your `.env` file.

---

## 3. Environment Variables

Add these to your `.env` file:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Web Push VAPID Keys (from step 2)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxx
VAPID_SUBJECT=mailto:your-email@example.com

# Cron Secret (generate a random string)
CRON_SECRET=your-random-secret-string

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Resend Setup

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month)
3. Verify your domain OR use their test domain
4. Create an API key
5. Add to `.env` as `RESEND_API_KEY`

---

## 5. Vercel Deployment (for Cron)

The cron job is configured in `vercel.json` to run every minute.

**After deploying to Vercel:**
1. Go to your project settings
2. Add all environment variables
3. The cron will automatically start running

**For local testing:**
- You can manually call the endpoint: `http://localhost:3000/api/cron/process-reminders`
- Add `Authorization: Bearer your-cron-secret` header

---

## 6. Testing

### Test Push Notifications:
1. Open your app in a browser
2. Go to Settings → Notifications
3. Enable push notifications
4. Grant browser permission
5. Create a task with a reminder for 1 minute from now
6. Wait for the notification

### Test Email Notifications:
1. Disable push in settings
2. Enable email
3. Create a reminder
4. Check your inbox

---

## 📁 Files Created

### Database
- `prisma/schema.prisma` - Updated with notification models
- `Complete Migration codes/Notification Infrastructure Migration.sql` - Migration SQL

### Server Actions
- `src/lib/actions/notifications.ts` - Preferences & subscription management

### Notification Services
- `src/lib/notifications/push.ts` - Client-side Web Push utilities
- `src/lib/notifications/send-push.ts` - Server-side push sender
- `src/lib/notifications/email.ts` - Email templates & sender
- `src/lib/notifications/processor.ts` - Core notification processor

### API Routes
- `src/app/api/cron/process-reminders/route.ts` - Cron endpoint

### UI Components
- `src/components/settings/notification-preferences.tsx` - Settings UI

### Config & Scripts
- `public/sw.js` - Service worker for push notifications
- `scripts/generate-vapid-keys.js` - VAPID key generator
- `vercel.json` - Cron configuration

---

## 🔧 Next Steps

1. Run the database migration
2. Generate and add VAPID keys
3. Sign up for Resend and add API key
4. Test locally
5. Deploy to Vercel
6. Verify cron is running in Vercel dashboard
