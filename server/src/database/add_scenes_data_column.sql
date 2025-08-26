-- Add scenes_data column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scenes_data JSONB DEFAULT '[]';