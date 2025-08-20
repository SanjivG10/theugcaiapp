-- AI UGC Platform - Supabase Database Schema
-- Copy and paste this entire file into Supabase SQL Editor

-- ============================================================================
-- 1. USERS TABLE (extends auth.users)
-- ============================================================================

-- Create users profile table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'business_owner')),
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. BUSINESSES TABLE
-- ============================================================================

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Business Information
  business_name TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN (
    'ecommerce', 'saas', 'agency', 'restaurant', 'retail', 'healthcare',
    'education', 'real_estate', 'fitness', 'beauty', 'automotive', 'financial', 'consulting', 'other'
  )),
  industry TEXT,
  business_size TEXT CHECK (business_size IN (
    'solo', '2-10', '11-50', '51-200', '201-1000', '1000+'
  )),

  -- Contact Information
  website_url TEXT,
  business_phone TEXT,
  business_address JSONB, -- {street, city, state, country, zip}

  -- Social Media Presence
  social_media_urls JSONB, -- {instagram, facebook, tiktok, youtube, linkedin, twitter}

  -- Marketing Attribution
  how_heard_about_us TEXT CHECK (how_heard_about_us IN (
    'google_search', 'social_media', 'referral', 'content_marketing',
    'paid_ads', 'word_of_mouth', 'industry_event', 'partner', 'other'
  )),
  referral_source TEXT, -- If referral, who referred them

  -- Internal Fields
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses table
CREATE POLICY "Users can view own business" ON public.businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own business" ON public.businesses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================================================

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,

  plan_name TEXT NOT NULL CHECK (plan_name IN ('trial', 'starter', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'unpaid')),

  -- Billing Information
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Plan Limits
  monthly_video_credits INTEGER DEFAULT 0,
  used_video_credits INTEGER DEFAULT 0,

  -- Billing Dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. VIDEO PROJECTS TABLE
-- ============================================================================

-- Create video_projects table
CREATE TABLE public.video_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  template_id UUID, -- Reference to template if used

  -- Video Generation
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'generating', 'completed', 'failed', 'processing'
  )),
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds

  -- AI Generation Metadata
  ai_provider TEXT, -- openai, runway, etc.
  generation_params JSONB,
  generation_cost DECIMAL(10,4),

  -- Usage Tracking
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for video_projects table
CREATE POLICY "Users can manage own videos" ON public.video_projects
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 5. TEMPLATES TABLE
-- ============================================================================

-- Create templates table
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  industry TEXT[],

  -- Template Configuration
  prompt_template TEXT NOT NULL,
  default_params JSONB,
  thumbnail_url TEXT,
  preview_video_url TEXT,

  -- Metadata
  is_premium BOOLEAN DEFAULT FALSE,
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates are public for read access, no RLS needed for SELECT
-- But we'll enable RLS for admin operations
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active templates
CREATE POLICY "Anyone can view active templates" ON public.templates
  FOR SELECT USING (is_active = TRUE);

-- Only admins can manage templates (you'll need to implement admin role check)
CREATE POLICY "Admins can manage templates" ON public.templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. USAGE LOGS TABLE
-- ============================================================================

-- Create usage_logs table for analytics
CREATE TABLE public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,

  action TEXT NOT NULL, -- 'video_generated', 'video_downloaded', 'login', etc.
  resource_type TEXT, -- 'video', 'template', etc.
  resource_id UUID,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for usage_logs table
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for all tables that have updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_projects_updated_at 
  BEFORE UPDATE ON public.video_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);

CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX idx_businesses_business_type ON public.businesses(business_type);
CREATE INDEX idx_businesses_onboarding_completed ON public.businesses(onboarding_completed);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_plan_name ON public.subscriptions(plan_name);

CREATE INDEX idx_video_projects_user_id ON public.video_projects(user_id);
CREATE INDEX idx_video_projects_business_id ON public.video_projects(business_id);
CREATE INDEX idx_video_projects_status ON public.video_projects(status);
CREATE INDEX idx_video_projects_created_at ON public.video_projects(created_at);

CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX idx_usage_logs_resource_type ON public.usage_logs(resource_type);

CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_is_active ON public.templates(is_active);
CREATE INDEX idx_templates_is_premium ON public.templates(is_premium);
CREATE INDEX idx_templates_popularity ON public.templates(popularity_score DESC);

-- ============================================================================
-- 9. SAMPLE DATA (Optional)
-- ============================================================================

-- Insert some sample templates
INSERT INTO public.templates (name, description, category, industry, prompt_template, is_active, popularity_score) VALUES
('Product Launch', 'Perfect for announcing new products with excitement', 'marketing', ARRAY['ecommerce', 'technology', 'retail'], 'Create an exciting product launch video for {{product_name}} that highlights {{key_features}} and targets {{target_audience}}', TRUE, 100),
('Testimonial', 'Showcase customer testimonials and reviews', 'social_proof', ARRAY['all'], 'Generate a testimonial video featuring {{customer_name}} talking about their experience with {{product_service}} and how it {{benefit_achieved}}', TRUE, 85),
('Behind the Scenes', 'Give viewers a peek behind the curtain', 'storytelling', ARRAY['all'], 'Create a behind-the-scenes video showing {{business_process}} that makes viewers feel connected to {{business_name}}', TRUE, 75),
('How-To Tutorial', 'Educational content that provides value', 'education', ARRAY['all'], 'Generate a tutorial video explaining how to {{task_description}} with clear steps and {{product_integration}}', TRUE, 90),
('Brand Story', 'Tell your brand''s compelling story', 'branding', ARRAY['all'], 'Create a brand story video for {{business_name}} that tells the journey from {{origin_story}} to {{current_mission}}', TRUE, 70);

-- ============================================================================
-- 10. FUNCTIONS FOR COMMON OPERATIONS (Optional but recommended)
-- ============================================================================

-- Function to get user's current subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  plan_name TEXT,
  status TEXT,
  monthly_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_name,
    s.status,
    s.monthly_video_credits,
    s.used_video_credits,
    (s.monthly_video_credits - s.used_video_credits) as remaining_credits
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('trialing', 'active')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate video (has credits)
CREATE OR REPLACE FUNCTION can_user_generate_video(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  remaining_credits INTEGER;
BEGIN
  SELECT (monthly_video_credits - used_video_credits) INTO remaining_credits
  FROM public.subscriptions
  WHERE user_id = user_uuid
    AND status IN ('trialing', 'active')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(remaining_credits, 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- After running this schema:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Enable the providers you want (Email, Google, etc.)
-- 3. Set up your environment variables in your application
-- 4. Test the authentication flow
--
-- Your database is now ready for the AI UGC Platform!

COMMENT ON SCHEMA public IS 'AI UGC Platform - Complete database schema with RLS policies, indexes, and helper functions';