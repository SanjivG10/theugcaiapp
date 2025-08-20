# Supabase Database Schema

## Tables Overview

This document outlines the database schema for the AI UGC Platform using Supabase.

## 1. Users Table (extends auth.users)

```sql
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

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

## 2. Businesses Table

```sql
-- Create businesses table
CREATE TABLE public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Business Information
  business_name TEXT NOT NULL,
  business_type TEXT,
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

-- Create policies
CREATE POLICY "Users can view own business" ON public.businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 3. Subscriptions Table

```sql
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

-- Create policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

## 4. Video Projects Table

```sql
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

-- Create policies
CREATE POLICY "Users can manage own videos" ON public.video_projects
  FOR ALL USING (auth.uid() = user_id);
```

## 5. Usage Logs Table

```sql
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

-- Create policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);
```

## 6. Templates Table

```sql
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

-- Templates are public, no RLS needed for read access
```

## Triggers for updated_at

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON public.video_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Indexes for Performance

```sql
-- Create indexes for better query performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX idx_businesses_business_type ON public.businesses(business_type);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_video_projects_user_id ON public.video_projects(user_id);
CREATE INDEX idx_video_projects_status ON public.video_projects(status);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_is_active ON public.templates(is_active);
```

## Simplified Multi-Step Signup Flow

The signup flow will collect data in these steps:

### Step 1: Basic Auth

- Email & Password (handled by Supabase Auth)

### Step 2: Personal Information

- First Name, Last Name, Phone (optional)

### Step 3: Business Basics

- Business Name, Business Type, Industry (optional), Business Size

### Step 4: Business Details (Optional)

- Website URL, Business Phone, Business Address, Social Media URLs

### Step 5: Marketing Attribution

- How they heard about us, Referral source (if applicable)

This schema provides comprehensive data collection while maintaining good performance and security through Supabase's Row Level Security.
