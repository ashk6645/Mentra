# 📝 Manual Database Migration Guide

## 🎯 Quick Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### 2. Copy & Paste the Migration
Copy the entire contents of: **`migrations/add_project_database_fields.sql`**

### 3. Run the Migration
Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

### 4. Verify Success
You should see: `✅ Migration successful! All 4 columns added.`

---

## 📁 Migration Files

### Main Migration
**File:** `migrations/add_project_database_fields.sql`

This adds:
- ✅ `ProjectStatus` enum (PLANNING, ACTIVE, ON_HOLD, COMPLETED)
- ✅ `ProjectPriority` enum (HIGH, MEDIUM, LOW)
- ✅ `status` column (default: ACTIVE)
- ✅ `priority` column (default: MEDIUM)
- ✅ `start_date` column (nullable)
- ✅ `target_date` column (nullable)
- ✅ Performance indexes
- ✅ Verification checks

### Rollback (Optional)
**File:** `migrations/rollback_project_database_fields.sql`

Use this if you need to undo the migration.

---

## 🔍 What Each Step Does

### Step 1: Create Enums
Creates PostgreSQL enum types for Status and Priority with safe error handling.

### Step 2: Add Columns
Adds 4 new columns to the `projects` table with appropriate defaults.

### Step 3: Create Indexes
Adds indexes for:
- Status filtering
- Priority filtering
- Date-based queries
- User + Status combinations

### Step 4: Verify RLS
Ensures Row Level Security is enabled (should already be).

### Step 5: Verify Migration
Confirms all columns were added successfully.

---

## ✅ After Running Migration

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Restart Your App
```bash
npm run dev
```

### 3. Test the Database
Visit: `http://localhost:3000/project-database`

---

## 🔎 Verify in Supabase

### Check the Table Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('status', 'priority', 'start_date', 'target_date');
```

### Check Existing Data
```sql
SELECT id, name, status, priority, start_date, target_date
FROM projects
LIMIT 10;
```

### Check Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'projects';
```

---

## 🐛 Troubleshooting

### Error: "type already exists"
This is normal! The migration uses `IF NOT EXISTS` checks. The enums are already created.

### Error: "column already exists"
This is also normal! The migration uses `ADD COLUMN IF NOT EXISTS`. Columns are already there.

### Error: Permission denied
Make sure you're using the **service_role** key or you're logged in as a superuser in Supabase.

### Migration runs but no columns appear
1. Check you're running in the correct database
2. Verify the table name is `projects` (not `project`)
3. Run the verification query above

---

## 📊 Expected Results

After successful migration, your `projects` table should have:

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| status | ProjectStatus | 'ACTIVE' | No |
| priority | ProjectPriority | 'MEDIUM' | No |
| start_date | timestamptz | NULL | Yes |
| target_date | timestamptz | NULL | Yes |

---

## 🎉 Success!

Once the migration completes successfully:
1. ✅ Your database is updated
2. ✅ All existing projects have ACTIVE status and MEDIUM priority
3. ✅ Indexes are created for fast queries
4. ✅ Ready to use the Project Database!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify your Prisma schema matches the database
3. Try running `npx prisma db pull` to sync schema
4. Check the verification queries above

---

**Next:** Run the migration in Supabase SQL Editor, then visit `/project-database`! 🚀
