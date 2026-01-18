-- 1. Create the 'areas_of_life' table
CREATE TABLE IF NOT EXISTS "public"."areas_of_life" (
    "id" text NOT NULL,
    "user_id" text NOT NULL,
    "name" text NOT NULL,
    "icon" text,
    "color" text,
    "sort_order" integer DEFAULT 0 NOT NULL,

    CONSTRAINT "areas_of_life_pkey" PRIMARY KEY ("id")
);

-- 2. Add Foreign Key for 'user_id' in 'areas_of_life'
ALTER TABLE "public"."areas_of_life" 
    ADD CONSTRAINT "areas_of_life_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "public"."profiles"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Add 'area_id' column to 'projects' table
ALTER TABLE "public"."projects" 
    ADD COLUMN IF NOT EXISTS "area_id" text;

-- 4. Add Foreign Key for 'area_id' in 'projects'
ALTER TABLE "public"."projects" 
    ADD CONSTRAINT "projects_area_id_fkey" 
    FOREIGN KEY ("area_id") 
    REFERENCES "public"."areas_of_life"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Create Index for 'area_id' on 'projects'
CREATE INDEX IF NOT EXISTS "projects_area_id_idx" ON "public"."projects"("area_id");
