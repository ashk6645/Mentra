-- =============================================
-- ROLLBACK Migration (if needed)
-- Use this to undo the Project Database changes
-- =============================================

-- Step 1: Remove Indexes
-- =============================================

DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_priority;
DROP INDEX IF EXISTS idx_projects_target_date;
DROP INDEX IF EXISTS idx_projects_start_date;
DROP INDEX IF EXISTS idx_projects_user_status;

-- Step 2: Remove Columns
-- =============================================

ALTER TABLE projects DROP COLUMN IF EXISTS status;
ALTER TABLE projects DROP COLUMN IF EXISTS priority;
ALTER TABLE projects DROP COLUMN IF EXISTS start_date;
ALTER TABLE projects DROP COLUMN IF EXISTS target_date;

-- Step 3: Drop Enums
-- =============================================

-- Note: Only drop if not used by other tables
DROP TYPE IF EXISTS "ProjectStatus";
DROP TYPE IF EXISTS "ProjectPriority";

-- Step 4: Verify Rollback
-- =============================================

DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name IN ('status', 'priority', 'start_date', 'target_date');
    
    IF column_count = 0 THEN
        RAISE NOTICE '✅ Rollback successful! All columns removed.';
    ELSE
        RAISE WARNING '⚠️ Rollback incomplete. Found % columns remaining', column_count;
    END IF;
END $$;

-- =============================================
-- Rollback Complete!
-- =============================================
