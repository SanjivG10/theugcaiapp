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

// Onboarding step form data types
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

// Complete onboarding data combining all steps
export interface CompleteOnboardingData {
  step1?: OnboardingStep1Data;
  step2?: OnboardingStep2Data;
  step3?: OnboardingStep3Data;
  step4?: OnboardingStep4Data;
}

// Combined business data for final submission
export interface BusinessOnboardingData
  extends Partial<OnboardingStep2Data>,
          Partial<OnboardingStep3Data>,
          Partial<OnboardingStep4Data> {}

export interface BusinessContextType {
  business: BusinessData | null;
  onboardingProgress: OnboardingProgress | null;
  loading: boolean;
  error: string | null;
  getBusiness: () => Promise<void>;
  updateBusiness: (data: Partial<BusinessData>) => Promise<void>;
  updateOnboardingStep: (step: number, data: OnboardingStepData) => Promise<void>;
  skipOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: (businessData?: BusinessOnboardingData) => Promise<void>;
  getOnboardingProgress: () => Promise<void>;
  clearError: () => void;
}

// Options for form dropdowns
export const BUSINESS_TYPES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'agency', label: 'Agency' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'financial', label: 'Financial' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
] as const;

export const BUSINESS_SIZES = [
  { value: 'solo', label: 'Solo (Just me)' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const;

export const HOW_HEARD_OPTIONS = [
  { value: 'google_search', label: 'Google Search' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'referral', label: 'Referral from friend/colleague' },
  { value: 'content_marketing', label: 'Blog/Content Marketing' },
  { value: 'paid_ads', label: 'Paid Advertisements' },
  { value: 'word_of_mouth', label: 'Word of Mouth' },
  { value: 'industry_event', label: 'Industry Event/Conference' },
  { value: 'partner', label: 'Partner/Integration' },
  { value: 'other', label: 'Other' },
] as const;

