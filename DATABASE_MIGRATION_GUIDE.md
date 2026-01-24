# 🗄️ Database Migration Guide

## Complete SQL Migration for Production

This guide provides the complete SQL migration script to set up your production database manually.

---

## 📋 Prerequisites

- PostgreSQL database (version 12 or higher)
- Database connection details (host, port, username, password, database name)
- psql client or database management tool (pgAdmin, DBeaver, etc.)

---

## 🚀 Quick Start

### Option 1: Using psql Command Line

```bash
# Connect to your database
psql -h your-host -U your-username -d your-database

# Run the migration file
\i PRODUCTION_MIGRATION.sql

# Verify tables were created
\dt

# Exit
\q
```

### Option 2: Using Database GUI (pgAdmin, DBeaver, etc.)

1. Open your database management tool
2. Connect to your production database
3. Open SQL query window
4. Copy and paste the contents of `PRODUCTION_MIGRATION.sql`
5. Execute the script
6. Verify all tables and indexes were created

### Option 3: Direct SQL Execution

```bash
# Execute SQL file directly
psql -h your-host -U your-username -d your-database -f PRODUCTION_MIGRATION.sql
```

---

## 📊 What Gets Created

### Enums (5)
- `ProjectStatus` - PLANNING, ACTIVE, ON_HOLD, COMPLETED
- `ProjectPriority` - HIGH, MEDIUM, LOW
- `BlockType` - 23 content block types
- `SourceType` - TASKS, PROJECTS, HABITS
- `ViewType` - TABLE, BOARD, GALLERY, LIST, CALENDAR, CHART

### Tables (19)

#### Core Tables
1. **profiles** - User profiles and gamification data
2. **projects** - Project management
3. **sections** - Project sections
4. **tasks** - Task management with time blocking
5. **tags** - Task tags
6. **task_tags** - Many-to-many relationship

#### Habits & Focus
7. **habits** - Habit tracking
8. **habit_completions** - Habit completion records
9. **focus_sessions** - Pomodoro/focus sessions

#### Gamification
10. **xp_logs** - Experience points tracking
11. **ai_activity_logs** - AI feature usage logs

#### Organization
12. **areas_of_life** - Life areas for projects
13. **shared_projects** - Project sharing
14. **reminders** - Task reminders

#### Private Pages System
15. **pages** - Notion-like pages
16. **blocks** - Content blocks within pages
17. **database_views** - Multiple views per database
18. **database_items** - Database rows/cards
19. **database_properties** - Database columns/properties

### Indexes (30+)

All critical indexes for performance:
- User lookups
- Project queries
- Task filtering
- Habit tracking
- Page navigation
- Block rendering

### Foreign Keys (25+)

All relationships properly configured with:
- CASCADE deletes where appropriate
- SET NULL for optional relationships
- Referential integrity enforced

---

## ✅ Verification Steps

After running the migration, verify everything is set up correctly:

### 1. Check Tables

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should return 19 tables
```

### 2. Check Indexes

```sql
-- List all indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Should return 30+ indexes
```

### 3. Check Foreign Keys

```sql
-- List all foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Should return 25+ foreign keys
```

### 4. Check Enums

```sql
-- List all enum types
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- Should return 5 enum types with their values
```

### 5. Test Insert (Optional)

```sql
-- Test creating a profile (use your Supabase user ID)
INSERT INTO profiles (id, email, display_name)
VALUES ('test-user-id', 'test@example.com', 'Test User');

-- Verify
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

**Problem**: Tables already exist in the database

**Solution**:
```sql
-- Drop all tables (CAUTION: This deletes all data!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO your_username;
GRANT ALL ON SCHEMA public TO public;

-- Then run the migration again
```

### Error: "permission denied"

**Problem**: User doesn't have sufficient privileges

**Solution**:
```sql
-- Grant necessary permissions (run as superuser)
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_username;
GRANT ALL ON SCHEMA public TO your_username;
```

### Error: "enum type already exists"

**Problem**: Enum types already exist

**Solution**:
```sql
-- Drop existing enums
DROP TYPE IF EXISTS "ProjectStatus" CASCADE;
DROP TYPE IF EXISTS "ProjectPriority" CASCADE;
DROP TYPE IF EXISTS "BlockType" CASCADE;
DROP TYPE IF EXISTS "SourceType" CASCADE;
DROP TYPE IF EXISTS "ViewType" CASCADE;

-- Then run the migration again
```

---

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete ALL data!

-- Drop all tables
DROP TABLE IF EXISTS database_properties CASCADE;
DROP TABLE IF EXISTS database_items CASCADE;
DROP TABLE IF EXISTS database_views CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS shared_projects CASCADE;
DROP TABLE IF EXISTS areas_of_life CASCADE;
DROP TABLE IF EXISTS ai_activity_logs CASCADE;
DROP TABLE IF EXISTS xp_logs CASCADE;
DROP TABLE IF EXISTS focus_sessions CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS "ViewType" CASCADE;
DROP TYPE IF EXISTS "SourceType" CASCADE;
DROP TYPE IF EXISTS "BlockType" CASCADE;
DROP TYPE IF EXISTS "ProjectPriority" CASCADE;
DROP TYPE IF EXISTS "ProjectStatus" CASCADE;
```

---

## 📈 Performance Optimization

After migration, consider these optimizations:

### 1. Analyze Tables

```sql
-- Update statistics for query planner
ANALYZE profiles;
ANALYZE projects;
ANALYZE tasks;
ANALYZE habits;
ANALYZE pages;
ANALYZE blocks;
-- ... repeat for all tables
```

### 2. Vacuum Tables

```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;
```

### 3. Check Index Usage

```sql
-- Monitor index usage over time
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 🔐 Security Recommendations

### 1. Create Application User

```sql
-- Create dedicated application user (not superuser)
CREATE USER app_user WITH PASSWORD 'strong_password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE your_database TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

### 2. Enable Row Level Security (RLS)

If using Supabase or need RLS:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Create policies (example for tasks)
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);
```

---

## 📊 Database Size Estimation

Expected database size for different user counts:

| Users | Tasks/User | Estimated Size |
|-------|------------|----------------|
| 100 | 50 | ~10 MB |
| 1,000 | 50 | ~100 MB |
| 10,000 | 50 | ~1 GB |
| 100,000 | 50 | ~10 GB |

*Note: Includes indexes and overhead*

---

## 🔄 Backup Strategy

### Before Migration

```bash
# Backup existing database (if any)
pg_dump -h your-host -U your-username -d your-database > backup_before_migration.sql
```

### After Migration

```bash
# Backup new schema
pg_dump -h your-host -U your-username -d your-database --schema-only > schema_backup.sql

# Full backup
pg_dump -h your-host -U your-username -d your-database > full_backup.sql
```

### Automated Backups

Set up automated daily backups:

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump -h your-host -U your-username -d your-database | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 🎯 Post-Migration Checklist

- [ ] All 19 tables created
- [ ] All 5 enums created
- [ ] 30+ indexes created
- [ ] 25+ foreign keys created
- [ ] Verification queries run successfully
- [ ] Test insert/select works
- [ ] Backup created
- [ ] Application user created (if needed)
- [ ] RLS policies set (if using Supabase)
- [ ] Connection string updated in `.env`
- [ ] Prisma client generated: `npm run prisma:generate`
- [ ] Application tested with new database

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify PostgreSQL version (12+)
3. Check user permissions
4. Review error messages carefully
5. Ensure database is empty before first migration

---

## 🚀 Next Steps

After successful migration:

1. Update your `.env` file with production database URL
2. Run `npm run prisma:generate` to generate Prisma client
3. Test database connection: `npm run prisma:studio`
4. Deploy your application
5. Monitor database performance

---

**Migration File**: `PRODUCTION_MIGRATION.sql`
**Last Updated**: January 25, 2026
**Database Version**: PostgreSQL 12+
**Status**: Production Ready ✅
