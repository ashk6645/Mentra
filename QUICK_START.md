# 🚀 Quick Start - 3 Steps to Launch

## Step 1: Fix TypeScript Errors (30 seconds)

**VS Code Users:**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter

✅ This will resolve all import errors!

---

## Step 2: Run Database Migration (1 minute)

```bash
# In your terminal
npx prisma migrate dev
```

✅ This sets up your database schema!

---

## Step 3: Test It! (2 minutes)

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000
```

✅ You should see the Mentra Dashboard!

---

## 🎉 That's It!

You now have a **fully functional Task Management app**!

### Try These Features:
1. ✅ Create a new task with natural language (e.g., "Buy milk tomorrow @personal")
2. ✅ Check off completed tasks
3. ✅ Organize tasks with tags
4. ✅ Track your habits

---

## 📱 Add to Your Sidebar (Optional)

Edit your sidebar component:

```tsx
<Link href="/tasks">
  <CheckSquare className="h-4 w-4" />
  Tasks
</Link>
```

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors
**Fix**: Restart TS Server (Step 1)

### Issue: Missing Dependencies
**Fix**: 
```bash
npm install @radix-ui/react-tooltip
```

### Issue: Database Errors
**Fix**: Check `.env` has `DATABASE_URL`

---

## 📚 Learn More

- **Full Docs**: `README.md`
- **Design System**: `DESIGN_SYSTEM.md`

---

## ✨ You're Done!

Start getting things done! 🎊
