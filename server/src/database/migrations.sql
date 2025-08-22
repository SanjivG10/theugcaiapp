-- Migration script to add missing tables and columns
-- Run this against your Supabase database

-- Add missing columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'incomplete')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed', 'cancelled')),
    campaign_type TEXT CHECK (campaign_type IN ('video', 'image', 'script')),
    prompt TEXT,
    settings JSONB DEFAULT '{}',
    output_urls TEXT[],
    thumbnail_url TEXT,
    credits_used INTEGER DEFAULT 0,
    estimated_credits INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 4,
    step_data JSONB DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'monthly_allocation', 'bonus')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    change_reason TEXT,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_usage_logs table
CREATE TABLE IF NOT EXISTS credit_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    feature_used TEXT,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business_users junction table
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_business_id ON credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_subscription_history_business_id ON subscription_history(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_business_id ON credit_usage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_id ON credit_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_campaign_id ON credit_usage_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_created_at ON credit_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for new tables
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_transactions_updated_at 
    BEFORE UPDATE ON credit_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_users_updated_at 
    BEFORE UPDATE ON business_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (user_id = auth.uid());

-- Credit transactions policies (business owners can view their business transactions)
CREATE POLICY "Business owners can view their credit transactions" ON credit_transactions
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
            UNION
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

-- Subscription history policies
CREATE POLICY "Business owners can view their subscription history" ON subscription_history
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
            UNION
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

-- Credit usage logs policies
CREATE POLICY "Business owners can view their credit usage logs" ON credit_usage_logs
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
            UNION
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

-- Business users policies
CREATE POLICY "Users can view business memberships they belong to" ON business_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage business memberships" ON business_users
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
            UNION
            SELECT business_id FROM business_users WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Add storage bucket for campaign assets if needed
-- INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-assets', 'campaign-assets', true) ON CONFLICT DO NOTHING;

-- Create storage policies for campaign assets
-- CREATE POLICY "Campaign assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');
-- CREATE POLICY "Authenticated users can upload campaign assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'campaign-assets' AND auth.role() = 'authenticated');

COMMENT ON TABLE campaigns IS 'Stores campaign information with step-by-step creation data';
COMMENT ON TABLE credit_transactions IS 'Tracks all credit-related transactions for businesses';
COMMENT ON TABLE subscription_history IS 'Maintains history of subscription plan changes';
COMMENT ON TABLE credit_usage_logs IS 'Logs credit usage for analytics and auditing';
COMMENT ON TABLE business_users IS 'Junction table for business-user relationships with roles';