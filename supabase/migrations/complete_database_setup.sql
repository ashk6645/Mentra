-- ========================================
-- COMPLETE DATABASE SETUP FOR TASK APP
-- ========================================
-- This file sets up the entire database schema, indexes, RLS policies, and triggers
-- Safe to run multiple times (idempotent)
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. CREATE TABLES
-- ========================================

-- 1.1 Profiles Table
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" text NOT NULL,
    "email" text NOT NULL,
    "display_name" text,
    "avatar_url" text,
    "preferences" jsonb DEFAULT '{}'::jsonb,
    "xp" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "streak_count" integer DEFAULT 0 NOT NULL,
    "last_active_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_email_key" UNIQUE ("email")
);

-- 1.2 Areas of Life Table
CREATE TABLE IF NOT EXISTS "public"."areas_of_life" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "icon" text,
    "color" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "areas_of_life_pkey" PRIMARY KEY ("id")
);

-- 1.3 Projects Table
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "color" text DEFAULT 'neutral',
    "icon" text,
    "is_archived" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "area_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- 1.4 Sections Table
CREATE TABLE IF NOT EXISTS "public"."sections" (
    "id" text NOT NULL,
    "project_id" text NOT NULL,
    "name" text NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- 1.5 Tasks Table
CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "project_id" text,
    "section_id" text,
    "parent_task_id" text,
    "title" text NOT NULL,
    "description" text,
    "priority" text DEFAULT 'NONE' NOT NULL,
    "due_date" date,
    "due_time" time without time zone,
    "is_completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "recurrence_rule" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- 1.6 Tags Table
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "color" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- 1.7 Task Tags Junction Table
CREATE TABLE IF NOT EXISTS "public"."task_tags" (
    "task_id" text NOT NULL,
    "tag_id" text NOT NULL,
    CONSTRAINT "task_tags_pkey" PRIMARY KEY ("task_id", "tag_id")
);

-- 1.8 Reminders Table
CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" text NOT NULL,
    "task_id" text NOT NULL,
    "remind_at" timestamp with time zone NOT NULL,
    "is_sent" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- 1.9 Habits Table
CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "frequency" text NOT NULL,
    "target_days" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- 1.10 Habit Completions Table
CREATE TABLE IF NOT EXISTS "public"."habit_completions" (
    "id" text NOT NULL,
    "habit_id" text NOT NULL,
    "completed_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id")
);

-- 1.11 Focus Sessions Table
CREATE TABLE IF NOT EXISTS "public"."focus_sessions" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "task_id" text,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_minutes" integer,
    "interruptions" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- 1.12 XP Logs Table
CREATE TABLE IF NOT EXISTS "public"."xp_logs" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "action" text NOT NULL,
    "points" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

-- 1.13 AI Activity Logs Table
CREATE TABLE IF NOT EXISTS "public"."ai_activity_logs" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "prompt" text NOT NULL,
    "response" text NOT NULL,
    "action_taken" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "ai_activity_logs_pkey" PRIMARY KEY ("id")
);

-- 1.14 Shared Projects Table
CREATE TABLE IF NOT EXISTS "public"."shared_projects" (
    "id" text NOT NULL,
    "project_id" text NOT NULL,
    "shared_with_user_id" text NOT NULL,
    "permission_level" text DEFAULT 'VIEWER' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "shared_projects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "shared_projects_project_id_shared_with_user_id_key" UNIQUE ("project_id", "shared_with_user_id")
);

-- ========================================
-- 2. ADD FOREIGN KEY CONSTRAINTS
-- ========================================

DO $$ 
BEGIN
    -- Areas of Life
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'areas_of_life_user_id_fkey') THEN
        ALTER TABLE "public"."areas_of_life" 
        ADD CONSTRAINT "areas_of_life_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Projects
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_user_id_fkey') THEN
        ALTER TABLE "public"."projects" 
        ADD CONSTRAINT "projects_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_area_id_fkey') THEN
        ALTER TABLE "public"."projects" 
        ADD CONSTRAINT "projects_area_id_fkey" 
        FOREIGN KEY ("area_id") REFERENCES "public"."areas_of_life"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Sections
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sections_project_id_fkey') THEN
        ALTER TABLE "public"."sections" 
        ADD CONSTRAINT "sections_project_id_fkey" 
        FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_user_id_fkey') THEN
        ALTER TABLE "public"."tasks" 
        ADD CONSTRAINT "tasks_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_project_id_fkey') THEN
        ALTER TABLE "public"."tasks" 
        ADD CONSTRAINT "tasks_project_id_fkey" 
        FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_section_id_fkey') THEN
        ALTER TABLE "public"."tasks" 
        ADD CONSTRAINT "tasks_section_id_fkey" 
        FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_parent_task_id_fkey') THEN
        ALTER TABLE "public"."tasks" 
        ADD CONSTRAINT "tasks_parent_task_id_fkey" 
        FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tags
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_user_id_fkey') THEN
        ALTER TABLE "public"."tags" 
        ADD CONSTRAINT "tags_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Task Tags
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_tags_task_id_fkey') THEN
        ALTER TABLE "public"."task_tags" 
        ADD CONSTRAINT "task_tags_task_id_fkey" 
        FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_tags_tag_id_fkey') THEN
        ALTER TABLE "public"."task_tags" 
        ADD CONSTRAINT "task_tags_tag_id_fkey" 
        FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Reminders
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reminders_task_id_fkey') THEN
        ALTER TABLE "public"."reminders" 
        ADD CONSTRAINT "reminders_task_id_fkey" 
        FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Habits
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habits_user_id_fkey') THEN
        ALTER TABLE "public"."habits" 
        ADD CONSTRAINT "habits_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Habit Completions
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habit_completions_habit_id_fkey') THEN
        ALTER TABLE "public"."habit_completions" 
        ADD CONSTRAINT "habit_completions_habit_id_fkey" 
        FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Focus Sessions
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'focus_sessions_user_id_fkey') THEN
        ALTER TABLE "public"."focus_sessions" 
        ADD CONSTRAINT "focus_sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'focus_sessions_task_id_fkey') THEN
        ALTER TABLE "public"."focus_sessions" 
        ADD CONSTRAINT "focus_sessions_task_id_fkey" 
        FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- XP Logs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'xp_logs_user_id_fkey') THEN
        ALTER TABLE "public"."xp_logs" 
        ADD CONSTRAINT "xp_logs_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- AI Activity Logs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_activity_logs_user_id_fkey') THEN
        ALTER TABLE "public"."ai_activity_logs" 
        ADD CONSTRAINT "ai_activity_logs_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Shared Projects
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shared_projects_project_id_fkey') THEN
        ALTER TABLE "public"."shared_projects" 
        ADD CONSTRAINT "shared_projects_project_id_fkey" 
        FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shared_projects_shared_with_user_id_fkey') THEN
        ALTER TABLE "public"."shared_projects" 
        ADD CONSTRAINT "shared_projects_shared_with_user_id_fkey" 
        FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 3. ADD CHECK CONSTRAINTS FOR DATA VALIDATION
-- ========================================

DO $$ 
BEGIN
    -- Profiles constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_xp_non_negative') THEN
        ALTER TABLE "public"."profiles" 
        ADD CONSTRAINT "check_xp_non_negative" CHECK (xp >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_level_positive') THEN
        ALTER TABLE "public"."profiles" 
        ADD CONSTRAINT "check_level_positive" CHECK (level > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_streak_non_negative') THEN
        ALTER TABLE "public"."profiles" 
        ADD CONSTRAINT "check_streak_non_negative" CHECK (streak_count >= 0);
    END IF;

    -- Focus sessions constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_duration_positive') THEN
        ALTER TABLE "public"."focus_sessions" 
        ADD CONSTRAINT "check_duration_positive" CHECK (duration_minutes IS NULL OR duration_minutes > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_interruptions_non_negative') THEN
        ALTER TABLE "public"."focus_sessions" 
        ADD CONSTRAINT "check_interruptions_non_negative" CHECK (interruptions >= 0);
    END IF;
END $$;

-- ========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Basic indexes on foreign keys
CREATE INDEX IF NOT EXISTS "idx_areas_of_life_user_id" ON "public"."areas_of_life"("user_id");
CREATE INDEX IF NOT EXISTS "idx_projects_user_id" ON "public"."projects"("user_id");
CREATE INDEX IF NOT EXISTS "idx_projects_area_id" ON "public"."projects"("area_id");
CREATE INDEX IF NOT EXISTS "idx_sections_project_id" ON "public"."sections"("project_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_user_id" ON "public"."tasks"("user_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "public"."tasks"("project_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_section_id" ON "public"."tasks"("section_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_due_date" ON "public"."tasks"("due_date");
CREATE INDEX IF NOT EXISTS "idx_tasks_is_completed" ON "public"."tasks"("is_completed");
CREATE INDEX IF NOT EXISTS "idx_tags_user_id" ON "public"."tags"("user_id");
CREATE INDEX IF NOT EXISTS "idx_task_tags_task_id" ON "public"."task_tags"("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_tags_tag_id" ON "public"."task_tags"("tag_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_task_id" ON "public"."reminders"("task_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_remind_at" ON "public"."reminders"("remind_at");
CREATE INDEX IF NOT EXISTS "idx_reminders_is_sent" ON "public"."reminders"("is_sent");
CREATE INDEX IF NOT EXISTS "idx_habits_user_id" ON "public"."habits"("user_id");
CREATE INDEX IF NOT EXISTS "idx_habit_completions_habit_id" ON "public"."habit_completions"("habit_id");
CREATE INDEX IF NOT EXISTS "idx_habit_completions_completed_at" ON "public"."habit_completions"("completed_at");
CREATE INDEX IF NOT EXISTS "idx_focus_sessions_user_id" ON "public"."focus_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_focus_sessions_task_id" ON "public"."focus_sessions"("task_id");
CREATE INDEX IF NOT EXISTS "idx_xp_logs_user_id" ON "public"."xp_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_activity_logs_user_id" ON "public"."ai_activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_shared_projects_project_id" ON "public"."shared_projects"("project_id");
CREATE INDEX IF NOT EXISTS "idx_shared_projects_shared_with_user_id" ON "public"."shared_projects"("shared_with_user_id");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_tasks_user_completed" ON "public"."tasks"("user_id", "is_completed");
CREATE INDEX IF NOT EXISTS "idx_tasks_user_due" ON "public"."tasks"("user_id", "due_date");
CREATE INDEX IF NOT EXISTS "idx_focus_sessions_user_started" ON "public"."focus_sessions"("user_id", "started_at" DESC);

-- Partial indexes for filtered queries (better performance)
CREATE INDEX IF NOT EXISTS "idx_active_tasks" ON "public"."tasks"("user_id", "due_date") 
WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS "idx_overdue_tasks" ON "public"."tasks"("user_id", "due_date") 
WHERE is_completed = false AND due_date < CURRENT_DATE;

CREATE INDEX IF NOT EXISTS "idx_active_projects" ON "public"."projects"("user_id", "sort_order") 
WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS "idx_active_habits" ON "public"."habits"("user_id") 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS "idx_unsent_reminders" ON "public"."reminders"("remind_at") 
WHERE is_sent = false;

-- ========================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."areas_of_life" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."task_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habit_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."xp_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shared_projects" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. CREATE RLS POLICIES
-- ========================================

-- Drop existing policies to avoid conflicts (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";

DROP POLICY IF EXISTS "Users can view their own areas_of_life" ON "public"."areas_of_life";
DROP POLICY IF EXISTS "Users can create their own areas_of_life" ON "public"."areas_of_life";
DROP POLICY IF EXISTS "Users can update their own areas_of_life" ON "public"."areas_of_life";
DROP POLICY IF EXISTS "Users can delete their own areas_of_life" ON "public"."areas_of_life";

DROP POLICY IF EXISTS "Users can view their own projects" ON "public"."projects";
DROP POLICY IF EXISTS "Users can create their own projects" ON "public"."projects";
DROP POLICY IF EXISTS "Users can update their own projects" ON "public"."projects";
DROP POLICY IF EXISTS "Users can delete their own projects" ON "public"."projects";
DROP POLICY IF EXISTS "Users can view projects shared with them" ON "public"."projects";

DROP POLICY IF EXISTS "Users can view their own sections" ON "public"."sections";
DROP POLICY IF EXISTS "Users can create their own sections" ON "public"."sections";
DROP POLICY IF EXISTS "Users can update their own sections" ON "public"."sections";
DROP POLICY IF EXISTS "Users can delete their own sections" ON "public"."sections";

DROP POLICY IF EXISTS "Users can view their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can create their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "public"."tasks";

DROP POLICY IF EXISTS "Users can view their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can create their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can update their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can delete their own tags" ON "public"."tags";

DROP POLICY IF EXISTS "Users can view task_tags for their own tasks" ON "public"."task_tags";
DROP POLICY IF EXISTS "Users can create task_tags for their own tasks" ON "public"."task_tags";
DROP POLICY IF EXISTS "Users can delete task_tags for their own tasks" ON "public"."task_tags";

DROP POLICY IF EXISTS "Users can view reminders for their own tasks" ON "public"."reminders";
DROP POLICY IF EXISTS "Users can create reminders for their own tasks" ON "public"."reminders";
DROP POLICY IF EXISTS "Users can update reminders for their own tasks" ON "public"."reminders";
DROP POLICY IF EXISTS "Users can delete reminders for their own tasks" ON "public"."reminders";

DROP POLICY IF EXISTS "Users can view their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can create their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can update their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can delete their own habits" ON "public"."habits";

DROP POLICY IF EXISTS "Users can view habit_completions for their own habits" ON "public"."habit_completions";
DROP POLICY IF EXISTS "Users can create habit_completions for their own habits" ON "public"."habit_completions";
DROP POLICY IF EXISTS "Users can delete habit_completions for their own habits" ON "public"."habit_completions";

DROP POLICY IF EXISTS "Users can view their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can create their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can update their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can delete their own focus_sessions" ON "public"."focus_sessions";

DROP POLICY IF EXISTS "Users can view their own xp_logs" ON "public"."xp_logs";
DROP POLICY IF EXISTS "Users can create their own xp_logs" ON "public"."xp_logs";

DROP POLICY IF EXISTS "Users can view their own ai_activity_logs" ON "public"."ai_activity_logs";
DROP POLICY IF EXISTS "Users can create their own ai_activity_logs" ON "public"."ai_activity_logs";

DROP POLICY IF EXISTS "Project owners can view shared_projects" ON "public"."shared_projects";
DROP POLICY IF EXISTS "Users can view projects shared with them via shared_projects" ON "public"."shared_projects";
DROP POLICY IF EXISTS "Project owners can share their projects" ON "public"."shared_projects";
DROP POLICY IF EXISTS "Project owners can update sharing permissions" ON "public"."shared_projects";
DROP POLICY IF EXISTS "Project owners can revoke sharing" ON "public"."shared_projects";

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON "public"."profiles"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- AREAS OF LIFE POLICIES
CREATE POLICY "Users can view their own areas_of_life" ON "public"."areas_of_life"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own areas_of_life" ON "public"."areas_of_life"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own areas_of_life" ON "public"."areas_of_life"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own areas_of_life" ON "public"."areas_of_life"
  FOR DELETE USING (auth.uid()::text = user_id);

-- PROJECTS POLICIES
CREATE POLICY "Users can view their own projects" ON "public"."projects"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own projects" ON "public"."projects"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects" ON "public"."projects"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects" ON "public"."projects"
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view projects shared with them" ON "public"."projects"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."shared_projects" 
      WHERE shared_projects.project_id = projects.id 
      AND shared_projects.shared_with_user_id = auth.uid()::text
    )
  );

-- SECTIONS POLICIES
CREATE POLICY "Users can view their own sections" ON "public"."sections"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."projects" WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create their own sections" ON "public"."sections"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."projects" WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update their own sections" ON "public"."sections"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "public"."projects" WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete their own sections" ON "public"."sections"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "public"."projects" WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

-- TASKS POLICIES
CREATE POLICY "Users can view their own tasks" ON "public"."tasks"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tasks" ON "public"."tasks"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tasks" ON "public"."tasks"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tasks" ON "public"."tasks"
  FOR DELETE USING (auth.uid()::text = user_id);

-- TAGS POLICIES
CREATE POLICY "Users can view their own tags" ON "public"."tags"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tags" ON "public"."tags"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tags" ON "public"."tags"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tags" ON "public"."tags"
  FOR DELETE USING (auth.uid()::text = user_id);

-- TASK_TAGS POLICIES
CREATE POLICY "Users can view task_tags for their own tasks" ON "public"."task_tags"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create task_tags for their own tasks" ON "public"."task_tags"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete task_tags for their own tasks" ON "public"."task_tags"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

-- REMINDERS POLICIES
CREATE POLICY "Users can view reminders for their own tasks" ON "public"."reminders"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create reminders for their own tasks" ON "public"."reminders"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update reminders for their own tasks" ON "public"."reminders"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete reminders for their own tasks" ON "public"."reminders"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "public"."tasks" WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

-- HABITS POLICIES
CREATE POLICY "Users can view their own habits" ON "public"."habits"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own habits" ON "public"."habits"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own habits" ON "public"."habits"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own habits" ON "public"."habits"
  FOR DELETE USING (auth.uid()::text = user_id);

-- HABIT_COMPLETIONS POLICIES
CREATE POLICY "Users can view habit_completions for their own habits" ON "public"."habit_completions"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."habits" WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create habit_completions for their own habits" ON "public"."habit_completions"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."habits" WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete habit_completions for their own habits" ON "public"."habit_completions"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "public"."habits" WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

-- FOCUS_SESSIONS POLICIES
CREATE POLICY "Users can view their own focus_sessions" ON "public"."focus_sessions"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own focus_sessions" ON "public"."focus_sessions"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own focus_sessions" ON "public"."focus_sessions"
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own focus_sessions" ON "public"."focus_sessions"
  FOR DELETE USING (auth.uid()::text = user_id);

-- XP_LOGS POLICIES (Insert and Select only - audit trail)
CREATE POLICY "Users can view their own xp_logs" ON "public"."xp_logs"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own xp_logs" ON "public"."xp_logs"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- AI_ACTIVITY_LOGS POLICIES (Insert and Select only - audit trail)
CREATE POLICY "Users can view their own ai_activity_logs" ON "public"."ai_activity_logs"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own ai_activity_logs" ON "public"."ai_activity_logs"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- SHARED_PROJECTS POLICIES
CREATE POLICY "Project owners can view shared_projects" ON "public"."shared_projects"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."projects" 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can view projects shared with them via shared_projects" ON "public"."shared_projects"
  FOR SELECT USING (auth.uid()::text = shared_with_user_id);

CREATE POLICY "Project owners can share their projects" ON "public"."shared_projects"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."projects" 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Project owners can update sharing permissions" ON "public"."shared_projects"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "public"."projects" 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Project owners can revoke sharing" ON "public"."shared_projects"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "public"."projects" 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- ========================================
-- 7. CREATE TRIGGERS
-- ========================================

-- 7.1 Auto-create profile on user signup
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "public"."profiles" (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS "on_auth_user_created" ON auth.users;
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- 7.2 Auto-update updated_at column
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS "update_profiles_updated_at" ON "public"."profiles";
CREATE TRIGGER "update_profiles_updated_at" 
BEFORE UPDATE ON "public"."profiles"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

DROP TRIGGER IF EXISTS "update_areas_of_life_updated_at" ON "public"."areas_of_life";
CREATE TRIGGER "update_areas_of_life_updated_at" 
BEFORE UPDATE ON "public"."areas_of_life"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

DROP TRIGGER IF EXISTS "update_projects_updated_at" ON "public"."projects";
CREATE TRIGGER "update_projects_updated_at" 
BEFORE UPDATE ON "public"."projects"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

DROP TRIGGER IF EXISTS "update_tasks_updated_at" ON "public"."tasks";
CREATE TRIGGER "update_tasks_updated_at" 
BEFORE UPDATE ON "public"."tasks"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

DROP TRIGGER IF EXISTS "update_habits_updated_at" ON "public"."habits";
CREATE TRIGGER "update_habits_updated_at" 
BEFORE UPDATE ON "public"."habits"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- ========================================
-- 8. CREATE PROFILES FOR EXISTING USERS
-- ========================================

-- This ensures any existing auth users have profiles
INSERT INTO "public"."profiles" (id, email, display_name, created_at, updated_at)
SELECT 
    au.id::text,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    NOW(),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."profiles" p WHERE p.id = au.id::text
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SETUP COMPLETE!
-- ========================================
-- Your database is now fully configured with:
-- ✅ All tables created
-- ✅ Foreign keys and constraints added
-- ✅ Performance indexes (basic + composite + partial)
-- ✅ RLS policies for security
-- ✅ Auto-profile creation trigger
-- ✅ Auto-updated_at triggers
-- ✅ Data validation constraints
-- ✅ Existing users have profiles