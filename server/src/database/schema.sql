-- Credits and Subscription System Schema

-- Update businesses table to include credit and subscription information
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Create credit_transactions table to track all credit movements
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'monthly_allocation', 'bonus')),
    amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_business_id ON credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_plan ON businesses(subscription_plan);

-- Create subscription_history table to track plan changes
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    change_reason TEXT,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscription history
CREATE INDEX IF NOT EXISTS idx_subscription_history_business_id ON subscription_history(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_effective_date ON subscription_history(effective_date);

-- Create credit_usage_logs table for detailed tracking of credit consumption
CREATE TABLE IF NOT EXISTS credit_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    feature_used TEXT,
    campaign_id UUID, -- Reference to campaign if applicable
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for credit usage logs
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_business_id ON credit_usage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_action_type ON credit_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_created_at ON credit_usage_logs(created_at);

-- Enable RLS on all new tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can view their business credit transactions" ON credit_transactions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for subscription_history
CREATE POLICY "Users can view their business subscription history" ON subscription_history
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage subscription history" ON subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for credit_usage_logs
CREATE POLICY "Users can view their business credit usage logs" ON credit_usage_logs
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage credit usage logs" ON credit_usage_logs
    FOR ALL USING (auth.role() = 'service_role');

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
    FROM businesses
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
    UPDATE businesses
    SET credits = new_balance,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Log the transaction
    INSERT INTO credit_transactions (
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

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed', 'cancelled')),
    campaign_type TEXT NOT NULL DEFAULT 'video' CHECK (campaign_type IN ('video', 'image', 'script')),
    prompt TEXT,
    settings JSONB DEFAULT '{}',
    output_urls TEXT[],
    thumbnail_url TEXT,
    credits_used INTEGER DEFAULT 0,
    estimated_credits INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Enable RLS on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their business campaigns" ON campaigns
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaigns for their business" ON campaigns
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their business campaigns" ON campaigns
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their business campaigns" ON campaigns
    FOR DELETE USING (
        business_id IN (
            SELECT business_id FROM business_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all campaigns" ON campaigns
    FOR ALL USING (auth.role() = 'service_role');

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
    FROM campaigns
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
    UPDATE campaigns
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
        INSERT INTO credit_usage_logs (
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
            (SELECT campaign_type FROM campaigns WHERE id = p_campaign_id),
            p_campaign_id,
            (SELECT user_id FROM campaigns WHERE id = p_campaign_id)
        );
    END IF;
END;
$$;