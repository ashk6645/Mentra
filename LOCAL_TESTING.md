# Local Testing Guide for Notifications

## 🧪 Quick Test Checklist

### Test 1: Reminder Creation (2 minutes)

1. **Create a task with reminder:**
   ```
   Title: "Test notification !2min tomorrow at 3pm"
   ```

2. **Verify in database:**
   ```sql
   SELECT 
     t.title,
     r.remind_at,
     r.is_sent
   FROM tasks t
   JOIN reminders r ON r.task_id = t.id
   ORDER BY t.created_at DESC
   LIMIT 1;
   ```
   
   **Expected:** `remind_at` should be ~2 minutes before the due date

---

### Test 2: Manual Cron Trigger (1 minute)

1. **Create a reminder for NOW:**
   - Manually insert in database:
   ```sql
   INSERT INTO reminders (id, task_id, remind_at, is_sent)
   VALUES (
     gen_random_uuid()::TEXT,
     'YOUR_TASK_ID',
     NOW(),
     false
   );
   ```

2. **Trigger cron manually:**
   ```bash
   curl http://localhost:3000/api/cron/process-reminders
   ```

3. **Check response:**
   ```json
   {
     "success": true,
     "stats": {
       "reminders": { "processed": 1, "sent": 1, "errors": 0 }
     }
   }
   ```

4. **Verify in database:**
   ```sql
   SELECT is_sent, sent_at, sent_via 
   FROM reminders 
   WHERE task_id = 'YOUR_TASK_ID';
   ```
   
   **Expected:** `is_sent = true`, `sent_via` contains `['email']` or `['push']`

---

### Test 3: Email Notification (if Resend is set up)

1. **Check .env has:**
   ```
   RESEND_API_KEY=re_xxxxx
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Create reminder for now (as in Test 2)**

3. **Trigger cron:**
   ```bash
   curl http://localhost:3000/api/cron/process-reminders
   ```

4. **Check your email inbox**
   - Should receive email with task title
   - Beautiful HTML template
   - "View Task" button

---

### Test 4: Overdue Notification

1. **Create overdue task:**
   ```sql
   UPDATE tasks 
   SET due_date = NOW() - INTERVAL '1 day'
   WHERE id = 'YOUR_TASK_ID';
   ```

2. **Trigger cron (overdue runs at minute :00):**
   ```bash
   # Wait until clock shows :00 OR
   # Modify cron code temporarily to always run overdue
   curl http://localhost:3000/api/cron/process-reminders
   ```

3. **Check email for "⚠️ OVERDUE" subject**

---

### Test 5: Reminder Badge in UI

1. **Open app:** http://localhost:3000/tasks

2. **Click "Add Task"**

3. **Type:** `Test task !30min tomorrow at 3pm`

4. **Expected:**
   - Purple badge appears with "30min"
   - Badge has X button to remove

---

## 🐛 Troubleshooting

### No email received?
```bash
# Check Resend API key
echo $RESEND_API_KEY

# Check cron response
curl http://localhost:3000/api/cron/process-reminders

# Check database
SELECT * FROM reminders WHERE is_sent = true ORDER BY sent_at DESC LIMIT 5;
```

### Reminder not created?
```bash
# Check if reminder helper is working
# In browser console:
import { calculateReminderTime } from '@/lib/utils/reminder-helper'
calculateReminderTime(new Date('2026-02-03T15:00:00'), '!30min')
// Should return: 2026-02-03T14:30:00
```

### Cron endpoint 401 error?
```bash
# Add Authorization header
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/process-reminders
```

---

## ✅ Success Criteria

- [ ] Reminder badge appears when typing `!30min`
- [ ] Reminder record created in database
- [ ] Cron endpoint returns success
- [ ] Email received (if Resend configured)
- [ ] Database shows `is_sent = true` after cron runs
- [ ] Overdue email received for past-due tasks

---

## 🚀 Ready for Production?

If all tests pass:
1. Merge PR to main
2. Deploy to Vercel
3. Add env vars in Vercel dashboard
4. Verify cron runs automatically every minute
