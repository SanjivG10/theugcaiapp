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