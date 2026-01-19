-- =====================================================
-- INLINE DATABASE SYSTEM MIGRATION (OPTIMIZED)
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CRITICAL INDEXES (add first for performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);

-- =====================================================
-- 2. Add parent_item_id column to blocks table
-- =====================================================

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS parent_item_id UUID;
CREATE INDEX IF NOT EXISTS idx_blocks_parent_item ON blocks(parent_item_id);

-- =====================================================
-- 3. Remove source_type from database_views (no longer needed)
-- =====================================================

ALTER TABLE database_views DROP COLUMN IF EXISTS source_type;

-- =====================================================
-- 4. Create database_items table
-- =====================================================

CREATE TABLE IF NOT EXISTS database_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    icon TEXT,
    cover_image TEXT,
    properties JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for database_items
CREATE INDEX IF NOT EXISTS idx_database_items_block ON database_items(block_id);
CREATE INDEX IF NOT EXISTS idx_database_items_block_sort ON database_items(block_id, sort_order);

-- GIN index for JSONB properties (critical for filtering)
CREATE INDEX IF NOT EXISTS idx_database_items_properties ON database_items USING GIN (properties);

-- =====================================================
-- 5. Create database_properties table
-- =====================================================

CREATE TABLE IF NOT EXISTS database_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Property',
    type TEXT NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'DATE', 'CHECKBOX', 'URL', 'EMAIL', 'PHONE')),
    options JSONB DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_database_properties_block ON database_properties(block_id);

-- =====================================================
-- 6. Updated_at triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_database_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_database_items_updated ON database_items;
CREATE TRIGGER trigger_database_items_updated
    BEFORE UPDATE ON database_items
    FOR EACH ROW
    EXECUTE FUNCTION update_database_items_timestamp();

CREATE OR REPLACE FUNCTION update_database_properties_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_database_properties_updated ON database_properties;
CREATE TRIGGER trigger_database_properties_updated
    BEFORE UPDATE ON database_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_database_properties_timestamp();

-- =====================================================
-- 7. RLS Policies for database_items
-- Note: auth.uid() returns TEXT, user_id is TEXT, so direct comparison
-- =====================================================

ALTER TABLE database_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own database items" ON database_items;
DROP POLICY IF EXISTS "Users can create database items" ON database_items;
DROP POLICY IF EXISTS "Users can update their own database items" ON database_items;
DROP POLICY IF EXISTS "Users can delete their own database items" ON database_items;

-- SELECT
CREATE POLICY "Users can view their own database items"
ON database_items FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_items.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- INSERT
CREATE POLICY "Users can create database items"
ON database_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_items.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- UPDATE
CREATE POLICY "Users can update their own database items"
ON database_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_items.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- DELETE
CREATE POLICY "Users can delete their own database items"
ON database_items FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_items.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- =====================================================
-- 8. RLS Policies for database_properties
-- =====================================================

ALTER TABLE database_properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own database properties" ON database_properties;
DROP POLICY IF EXISTS "Users can create database properties" ON database_properties;
DROP POLICY IF EXISTS "Users can update their own database properties" ON database_properties;
DROP POLICY IF EXISTS "Users can delete their own database properties" ON database_properties;

-- SELECT
CREATE POLICY "Users can view their own database properties"
ON database_properties FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_properties.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- INSERT
CREATE POLICY "Users can create database properties"
ON database_properties FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_properties.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- UPDATE
CREATE POLICY "Users can update their own database properties"
ON database_properties FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_properties.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- DELETE
CREATE POLICY "Users can delete their own database properties"
ON database_properties FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM blocks b
        JOIN pages p ON p.id = b.page_id
        WHERE b.id = database_properties.block_id
          AND p.user_id = (auth.uid())::text
    )
);

-- =====================================================
-- 9. Add FK constraint for blocks.parent_item_id
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'blocks_parent_item_id_fkey'
    ) THEN
        ALTER TABLE blocks 
        ADD CONSTRAINT blocks_parent_item_id_fkey 
        FOREIGN KEY (parent_item_id) REFERENCES database_items(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Done!
