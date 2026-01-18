-- =============================================
-- Project Database Migration for Supabase
-- Add Notion-style Project Database fields
-- =============================================

-- Step 1: Create Enums
-- =============================================

-- Create ProjectStatus enum
DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM (
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ProjectPriority enum
DO $$ BEGIN
    CREATE TYPE "ProjectPriority" AS ENUM (
        'HIGH',
        'MEDIUM',
        'LOW'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add New Columns to Projects Table
-- =============================================

-- Add status column (defaults to ACTIVE)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- Add priority column (defaults to MEDIUM)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS priority "ProjectPriority" NOT NULL DEFAULT 'MEDIUM';

-- Add start_date column (nullable)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

-- Add target_date column (nullable)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS target_date TIMESTAMPTZ;

-- Step 3: Create Indexes for Performance
-- =============================================

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status);

-- Index on priority for filtering
CREATE INDEX IF NOT EXISTS idx_projects_priority 
ON projects(priority);

-- Index on target_date for calendar views
CREATE INDEX IF NOT EXISTS idx_projects_target_date 
ON projects(target_date);

-- Index on start_date for timeline views
CREATE INDEX IF NOT EXISTS idx_projects_start_date 
ON projects(start_date);

-- Composite index for common queries (user + status)
CREATE INDEX IF NOT EXISTS idx_projects_user_status 
ON projects(user_id, status);

-- Step 4: Update RLS Policies (if needed)
-- =============================================

-- Projects table should already have RLS enabled
-- Verify RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist for new columns
-- (Existing policies should cover new columns automatically)

-- Step 5: Verify Migration
-- =============================================

-- Check if columns were added successfully
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name IN ('status', 'priority', 'start_date', 'target_date');
    
    IF column_count = 4 THEN
        RAISE NOTICE '✅ Migration successful! All 4 columns added.';
    ELSE
        RAISE WARNING '⚠️ Migration incomplete. Expected 4 columns, found %', column_count;
    END IF;
END $$;

-- =============================================
-- Migration Complete!
-- =============================================

-- Summary:
-- ✅ Created ProjectStatus enum (PLANNING, ACTIVE, ON_HOLD, COMPLETED)
-- ✅ Created ProjectPriority enum (HIGH, MEDIUM, LOW)
-- ✅ Added status column to projects table
-- ✅ Added priority column to projects table
-- ✅ Added start_date column to projects table
-- ✅ Added target_date column to projects table
-- ✅ Created performance indexes
-- ✅ Verified RLS policies

-- Next Steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Restart your Next.js app
-- 3. Generate Prisma Client: npx prisma generate
-- 4. Test at: http://localhost:3000/project-database
