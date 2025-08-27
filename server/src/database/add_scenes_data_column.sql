-- Add scene_data column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scene_data JSONB DEFAULT '[]';