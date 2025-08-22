-- AI UGC Platform Complete Database Schema
-- This file contains all tables, indexes, policies, and functions needed for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'business_owner')),
    email_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'active', 'past_due', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    business_size TEXT,
    industry TEXT,
    business_phone TEXT,
    website_url TEXT,
    business_address JSONB,
    social_media_urls JSONB,
    
    -- Onboarding fields
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 1,
    how_heard_about_us TEXT,
    referral_source TEXT,
    
    -- Credit and subscription fields
    credits INTEGER DEFAULT 0,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'incomplete')),
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS_USERS JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, user_id)
);

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed', 'cancelled')),
    campaign_type TEXT CHECK (campaign_type IN ('video', 'image', 'script')),
    prompt TEXT,
    settings JSONB DEFAULT '{}',
    output_urls TEXT[],
    thumbnail_url TEXT,
    credits_used INTEGER DEFAULT 0,
    estimated_credits INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- Step tracking for progressive creation
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 4,
    step_data JSONB DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREDIT_TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'monthly_allocation', 'bonus')),
    amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTION_HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    change_reason TEXT,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREDIT_USAGE_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.credit_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    feature_used TEXT,
    campaign_id UUID REFERENCES public.campaigns(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VIDEO_PROJECTS TABLE (from existing schema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    ai_provider TEXT,
    generation_params JSONB,
    generation_cost NUMERIC(10,4),
    video_url TEXT,
    thumbnail_url TEXT,
    duration NUMERIC(8,2), -- in seconds
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    template_id UUID REFERENCES public.templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEMPLATES TABLE (from existing schema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    industry TEXT[],
    prompt_template TEXT NOT NULL,
    default_params JSONB,
    thumbnail_url TEXT,
    preview_video_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE (from existing schema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    monthly_video_credits INTEGER,
    used_video_credits INTEGER DEFAULT 0,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FEEDBACK TABLE (from existing schema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    business_id UUID REFERENCES public.businesses(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'support_request')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USAGE_LOGS TABLE (from existing schema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    business_id UUID REFERENCES public.businesses(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON public.businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_plan ON public.businesses(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses(is_active);

-- Business users indexes
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON public.business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON public.business_users(user_id);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_business_id ON public.credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- Subscription history indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_business_id ON public.subscription_history(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_effective_date ON public.subscription_history(effective_date);

-- Credit usage logs indexes
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_business_id ON public.credit_usage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_action_type ON public.credit_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_created_at ON public.credit_usage_logs(created_at);

-- Video projects indexes
CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON public.video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_business_id ON public.video_projects(business_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON public.video_projects(status);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON public.templates(is_active);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON public.feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_business_id ON public.usage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Users can view their businesses" ON public.businesses
    FOR SELECT USING (
        user_id = auth.uid() OR 
        id IN (SELECT business_id FROM public.business_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their businesses" ON public.businesses
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        id IN (SELECT business_id FROM public.business_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can insert their businesses" ON public.businesses
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Business users policies
CREATE POLICY "Users can view their business memberships" ON public.business_users
    FOR SELECT USING (
        user_id = auth.uid() OR 
        business_id IN (SELECT business_id FROM public.business_users WHERE user_id = auth.uid())
    );

-- Campaigns policies
CREATE POLICY "Users can view their business campaigns" ON public.campaigns
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM public.business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaigns for their business" ON public.campaigns
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.business_users WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their business campaigns" ON public.campaigns
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM public.business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their business campaigns" ON public.campaigns
    FOR DELETE USING (
        business_id IN (
            SELECT business_id FROM public.business_users WHERE user_id = auth.uid()
        )
    );

-- Credit transactions policies
CREATE POLICY "Users can view their business credit transactions" ON public.credit_transactions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM public.business_users WHERE user_id = auth.uid()
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Service role can manage all data" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all businesses" ON public.businesses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all campaigns" ON public.campaigns
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all credit transactions" ON public.credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Templates are publicly readable
CREATE POLICY "Templates are publicly readable" ON public.templates
    FOR SELECT USING (is_active = true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to safely update business credits
CREATE OR REPLACE FUNCTION update_business_credits(
    p_business_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits
    FROM public.businesses
    WHERE id = p_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business not found';
    END IF;

    -- Calculate new balance
    new_balance := current_credits + p_amount;

    -- Prevent negative credits for usage transactions
    IF p_transaction_type = 'usage' AND new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', current_credits, ABS(p_amount);
    END IF;

    -- Update business credits
    UPDATE public.businesses
    SET credits = new_balance,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Log the transaction
    INSERT INTO public.credit_transactions (
        business_id,
        transaction_type,
        amount,
        balance_after,
        description,
        metadata,
        stripe_payment_intent_id
    ) VALUES (
        p_business_id,
        p_transaction_type,
        p_amount,
        new_balance,
        p_description,
        p_metadata,
        p_stripe_payment_intent_id
    );

    RETURN new_balance;
END;
$$;

-- Function to update campaign status and credits
CREATE OR REPLACE FUNCTION update_campaign_status(
    p_campaign_id UUID,
    p_status TEXT,
    p_credits_used INTEGER DEFAULT NULL,
    p_output_urls TEXT[] DEFAULT NULL,
    p_thumbnail_url TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_current_credits_used INTEGER;
    v_credit_difference INTEGER;
BEGIN
    -- Get campaign details
    SELECT business_id, credits_used INTO v_business_id, v_current_credits_used
    FROM public.campaigns
    WHERE id = p_campaign_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaign not found';
    END IF;

    -- Calculate credit difference if credits_used is provided
    IF p_credits_used IS NOT NULL THEN
        v_credit_difference := p_credits_used - v_current_credits_used;
        
        -- Update business credits if there's a difference
        IF v_credit_difference != 0 THEN
            PERFORM update_business_credits(
                v_business_id,
                -v_credit_difference, -- Negative because we're consuming credits
                'usage',
                'Campaign credit adjustment for campaign ' || p_campaign_id,
                jsonb_build_object('campaign_id', p_campaign_id, 'status_change', p_status)
            );
        END IF;
    END IF;

    -- Update campaign
    UPDATE public.campaigns
    SET 
        status = p_status,
        credits_used = COALESCE(p_credits_used, credits_used),
        output_urls = COALESCE(p_output_urls, output_urls),
        thumbnail_url = COALESCE(p_thumbnail_url, thumbnail_url),
        completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
        started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
        updated_at = NOW()
    WHERE id = p_campaign_id;

    -- Log credit usage if credits were used
    IF p_credits_used IS NOT NULL AND v_credit_difference > 0 THEN
        INSERT INTO public.credit_usage_logs (
            business_id,
            action_type,
            credits_used,
            feature_used,
            campaign_id,
            user_id
        ) VALUES (
            v_business_id,
            'campaign_generation',
            v_credit_difference,
            (SELECT campaign_type FROM public.campaigns WHERE id = p_campaign_id),
            p_campaign_id,
            (SELECT user_id FROM public.campaigns WHERE id = p_campaign_id)
        );
    END IF;
END;
$$;

-- Function to create business_user relationship when business is created
CREATE OR REPLACE FUNCTION create_business_user_relationship()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.business_users (business_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create business_user relationship
CREATE TRIGGER trigger_create_business_user
    AFTER INSERT ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION create_business_user_relationship();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_video_projects_updated_at
    BEFORE UPDATE ON public.video_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ADDITIONAL FUNCTIONS FROM EXISTING SCHEMA
-- =============================================

-- Function to check if user can generate video
CREATE OR REPLACE FUNCTION can_user_generate_video(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_credits INTEGER;
    business_credits INTEGER;
BEGIN
    -- Get user's business credits
    SELECT b.credits INTO business_credits
    FROM public.businesses b
    JOIN public.business_users bu ON b.id = bu.business_id
    WHERE bu.user_id = user_uuid
    LIMIT 1;

    -- Return true if user has sufficient credits
    RETURN COALESCE(business_credits, 0) >= 1;
END;
$$;

-- Function to get user subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE(
    plan_name TEXT,
    status TEXT,
    monthly_credits INTEGER,
    used_credits INTEGER,
    remaining_credits INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.subscription_plan,
        b.subscription_status,
        CASE b.subscription_plan
            WHEN 'free' THEN 10
            WHEN 'starter' THEN 100
            WHEN 'professional' THEN 500
            WHEN 'enterprise' THEN 2000
            ELSE 10
        END as monthly_credits,
        COALESCE((
            SELECT SUM(credits_used) 
            FROM public.credit_usage_logs 
            WHERE business_id = b.id 
            AND created_at >= DATE_TRUNC('month', NOW())
        ), 0)::INTEGER as used_credits,
        b.credits as remaining_credits
    FROM public.businesses b
    JOIN public.business_users bu ON b.id = bu.business_id
    WHERE bu.user_id = user_uuid
    LIMIT 1;
END;
$$;