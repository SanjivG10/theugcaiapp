-- Migration script to ensure campaign_type field has proper constraints
-- Run this in your Supabase SQL editor

-- First, let's check if there are any invalid campaign types
SELECT DISTINCT campaign_type FROM campaigns WHERE campaign_type NOT IN ('video', 'image', 'script') AND campaign_type IS NOT NULL;

-- Add constraint to campaign_type column to only allow specific values
-- This will create a check constraint
DO $$
BEGIN
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_campaign_type_check' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT campaigns_campaign_type_check 
        CHECK (campaign_type IN ('video', 'image', 'script'));
    END IF;
END$$;

-- Ensure current_step has appropriate defaults and constraints
DO $$
BEGIN
    -- Drop existing constraint if it exists with wrong max value
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_current_step_check' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE campaigns DROP CONSTRAINT campaigns_current_step_check;
    END IF;
    
    -- Add new constraint with correct max value
    ALTER TABLE campaigns 
    ADD CONSTRAINT campaigns_current_step_check 
    CHECK (current_step >= 1 AND current_step <= 7);
END$$;

-- Ensure total_steps has appropriate defaults and constraints  
DO $$
BEGIN
    -- Add check constraint for total_steps if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_total_steps_check' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT campaigns_total_steps_check 
        CHECK (total_steps >= 1 AND total_steps <= 10);
    END IF;
END$$;

-- Set default values for step-related fields if they're not already set
ALTER TABLE campaigns 
  ALTER COLUMN current_step SET DEFAULT 1,
  ALTER COLUMN total_steps SET DEFAULT 7;

-- Update any existing campaigns that don't have these values set
UPDATE campaigns 
SET 
  current_step = COALESCE(current_step, 1),
  total_steps = COALESCE(total_steps, 7)
WHERE current_step IS NULL OR total_steps IS NULL;

-- Create an index on campaign_type for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_current_step ON campaigns(current_step);