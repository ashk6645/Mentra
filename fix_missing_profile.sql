-- This script creates a profile entry for your Supabase user
-- Run this in the Supabase SQL Editor

INSERT INTO "public"."profiles" (id, email, display_name, updated_at)
SELECT 
    au.id::text,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."profiles" p WHERE p.id = au.id::text
);
