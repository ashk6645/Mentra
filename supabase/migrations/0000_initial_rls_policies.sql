-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_of_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES POLICIES
-- ========================================
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- ========================================
-- PROJECTS POLICIES
-- ========================================
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid()::text = user_id);

-- Users can view projects shared with them
CREATE POLICY "Users can view projects shared with them" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_projects 
      WHERE shared_projects.project_id = projects.id 
      AND shared_projects.shared_with_user_id = auth.uid()::text
    )
  );

-- ========================================
-- SECTIONS POLICIES
-- ========================================
CREATE POLICY "Users can view their own sections" ON sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create their own sections" ON sections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update their own sections" ON sections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete their own sections" ON sections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = sections.project_id AND projects.user_id = auth.uid()::text)
  );

-- ========================================
-- TASKS POLICIES
-- ========================================
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- TAGS POLICIES
-- ========================================
CREATE POLICY "Users can view their own tags" ON tags
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tags" ON tags
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
  FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- TASK_TAGS POLICIES (Junction Table)
-- ========================================
CREATE POLICY "Users can view task_tags for their own tasks" ON task_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create task_tags for their own tasks" ON task_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete task_tags for their own tasks" ON task_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)
  );

-- ========================================
-- REMINDERS POLICIES
-- ========================================
CREATE POLICY "Users can view reminders for their own tasks" ON reminders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create reminders for their own tasks" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update reminders for their own tasks" ON reminders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete reminders for their own tasks" ON reminders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()::text)
  );

-- ========================================
-- HABITS POLICIES
-- ========================================
CREATE POLICY "Users can view their own habits" ON habits
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own habits" ON habits
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own habits" ON habits
  FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- HABIT_COMPLETIONS POLICIES
-- ========================================
CREATE POLICY "Users can view habit_completions for their own habits" ON habit_completions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create habit_completions for their own habits" ON habit_completions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete habit_completions for their own habits" ON habit_completions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()::text)
  );

-- ========================================
-- FOCUS_SESSIONS POLICIES
-- ========================================
CREATE POLICY "Users can view their own focus_sessions" ON focus_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own focus_sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own focus_sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own focus_sessions" ON focus_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- XP_LOGS POLICIES
-- ========================================
CREATE POLICY "Users can view their own xp_logs" ON xp_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own xp_logs" ON xp_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- XP logs should not be updated or deleted to maintain audit trail
-- No UPDATE or DELETE policies

-- ========================================
-- AI_ACTIVITY_LOGS POLICIES
-- ========================================
CREATE POLICY "Users can view their own ai_activity_logs" ON ai_activity_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own ai_activity_logs" ON ai_activity_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- AI logs should not be updated or deleted to maintain audit trail
-- No UPDATE or DELETE policies

-- ========================================
-- AREAS_OF_LIFE POLICIES
-- ========================================
CREATE POLICY "Users can view their own areas_of_life" ON areas_of_life
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own areas_of_life" ON areas_of_life
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own areas_of_life" ON areas_of_life
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own areas_of_life" ON areas_of_life
  FOR DELETE USING (auth.uid()::text = user_id);

-- ========================================
-- SHARED_PROJECTS POLICIES
-- ========================================
-- Project owners can view who they've shared projects with
CREATE POLICY "Project owners can view shared_projects" ON shared_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- Users can view projects that have been shared with them
CREATE POLICY "Users can view projects shared with them" ON shared_projects
  FOR SELECT USING (auth.uid()::text = shared_with_user_id);

-- Only project owners can share projects
CREATE POLICY "Project owners can share their projects" ON shared_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- Only project owners can update sharing permissions
CREATE POLICY "Project owners can update sharing permissions" ON shared_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- Only project owners can revoke sharing
CREATE POLICY "Project owners can revoke sharing" ON shared_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = shared_projects.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- ========================================
-- AUTO-CREATE PROFILE TRIGGER
-- ========================================
-- This function creates a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
-- These indexes are already defined in Prisma schema, but listing them for completeness

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_area_id ON projects(area_id);

-- Sections
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);

-- Reminders
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);

-- Habit Completions
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON habit_completions(completed_at);
