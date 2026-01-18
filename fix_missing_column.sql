-- Force add the missing column to projects table
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "area_id" text;

-- Add the foreign key constraint if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_area_id_fkey') THEN 
    ALTER TABLE "public"."projects" 
    ADD CONSTRAINT "projects_area_id_fkey" 
    FOREIGN KEY ("area_id") 
    REFERENCES "public"."areas_of_life"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE; 
  END IF; 
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS "projects_area_id_idx" ON "public"."projects"("area_id");
