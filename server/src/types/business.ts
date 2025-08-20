export interface BusinessData {
  id?: string;
  user_id: string;
  
  // Basic Business Information (Required)
  business_name: string;
  business_type: 'ecommerce' | 'saas' | 'agency' | 'restaurant' | 'retail' | 
    'healthcare' | 'education' | 'real_estate' | 'fitness' | 'beauty' | 
    'automotive' | 'financial' | 'consulting' | 'other';
  business_size: 'solo' | '2-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  
  // Optional Business Information
  industry?: string;
  website_url?: string;
  business_phone?: string;
  business_address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  
  // Social Media Presence (Optional)
  social_media_urls?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
  };
  
  // Marketing Attribution (Required)
  how_heard_about_us: 'google_search' | 'social_media' | 'referral' | 
    'content_marketing' | 'paid_ads' | 'word_of_mouth' | 'industry_event' | 
    'partner' | 'other';
  referral_source?: string;
  
  // Internal Fields
  onboarding_step?: number;
  onboarding_completed?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessUpdateRequest {
  step: number;
  data: OnboardingStepData;
}

// Simplified onboarding steps
export interface OnboardingStep1Data {
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface OnboardingStep2Data {
  business_name: string;
  business_type: BusinessData['business_type'];
  industry?: string;
  business_size: BusinessData['business_size'];
}

export interface OnboardingStep3Data {
  website_url?: string;
  business_phone?: string;
  business_address?: BusinessData['business_address'];
  social_media_urls?: BusinessData['social_media_urls'];
}

export interface OnboardingStep4Data {
  how_heard_about_us: BusinessData['how_heard_about_us'];
  referral_source?: string;
}

export type OnboardingStepData = 
  | OnboardingStep1Data
  | OnboardingStep2Data
  | OnboardingStep3Data
  | OnboardingStep4Data;

export interface OnboardingProgress {
  current_step: number;
  completed: boolean;
  business_data?: BusinessData;
}

// Combined business data for final submission
export interface BusinessOnboardingData
  extends Partial<OnboardingStep2Data>,
          Partial<OnboardingStep3Data>,
          Partial<OnboardingStep4Data> {}