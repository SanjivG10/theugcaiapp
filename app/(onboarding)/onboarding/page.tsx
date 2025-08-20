"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { URLS } from "@/constants/urls";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import {
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  BusinessOnboardingData,
  CompleteOnboardingData,
  HOW_HEARD_OPTIONS,
  OnboardingStep2Data,
  OnboardingStep4Data,
} from "@/types/business";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronLeft,
  Globe,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

const TOTAL_STEPS = 4;

// Step 1: Personal Information
const step1Schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid phone number",
    }),
});

// Step 2: Business Basics
const step2Schema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_type: z.enum(
    BUSINESS_TYPES.map((t) => t.value) as [string, ...string[]]
  ),
  industry: z.string().optional(),
  business_size: z.enum(
    BUSINESS_SIZES.map((s) => s.value) as [string, ...string[]]
  ),
});

// Step 3: Business Details (Optional)
const step3Schema = z.object({
  website_url: z.string().url().optional().or(z.literal("")),
  business_phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid phone number",
    }),
  business_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  social_media_urls: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
});

// Step 4: Marketing Attribution
const step4Schema = z.object({
  how_heard_about_us: z.enum(
    HOW_HEARD_OPTIONS.map((h) => h.value) as [string, ...string[]]
  ),
  referral_source: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<CompleteOnboardingData>(
    {}
  );
  const { user, updateProfile, setUser } = useAuth();
  const { loading, completeOnboarding } = useBusiness();
  const router = useRouter();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
  });

  // Initialize forms with any existing user data
  useEffect(() => {
    if (user?.id) {
      step1Form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
  }, [user?.id]);

  const handleNext = async () => {
    try {
      let isValid = false;
      let data: Record<string, unknown> = {};

      switch (currentStep) {
        case 1:
          isValid = await step1Form.trigger();
          if (isValid) {
            data = step1Form.getValues();
            setOnboardingData((prev) => ({
              ...prev,
              step1: data as Step1Data,
            }));
          }
          break;
        case 2:
          isValid = await step2Form.trigger();
          if (isValid) {
            data = step2Form.getValues();
            setOnboardingData((prev) => ({
              ...prev,
              step2: data as unknown as OnboardingStep2Data,
            }));
          }
          break;
        case 3:
          isValid = true; // Step 3 is optional
          data = step3Form.getValues();
          setOnboardingData((prev) => ({ ...prev, step3: data as Step3Data }));
          break;
        case 4:
          isValid = await step4Form.trigger();
          if (isValid) {
            data = step4Form.getValues();
            const finalData = {
              ...onboardingData,
              step4: data as unknown as OnboardingStep4Data,
            };
            setOnboardingData(finalData);

            // Submit all data at once and complete onboarding
            await submitCompleteOnboarding(finalData as CompleteOnboardingData);
            return;
          }
          break;
      }

      if (isValid && currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Onboarding step error:", error);
    }
  };

  const submitCompleteOnboarding = async (allData: CompleteOnboardingData) => {
    try {
      // First update user profile if step 1 data exists
      if (allData.step1) {
        await updateProfile(allData.step1);
      }

      // Then create/update business with all business data
      const businessData: BusinessOnboardingData = {
        ...allData.step2,
        ...allData.step3,
        ...allData.step4,
      };

      // Complete onboarding with all data
      await completeOnboarding(businessData);
      // I think by the time we redirect, we have no onboarding data left and are redirect back to dashboard, can we do anything about that?
      if (!user) return;
      setUser({ ...user, onboarding_completed: true });
      router.push(URLS.DASHBOARD.HOME);
    } catch (error) {
      console.error("Complete onboarding error:", error);
      throw error;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const stepIcons = [User, Building2, Globe, MessageSquare];
  const stepTitles = [
    "Personal Information",
    "Business Basics",
    "Business Details",
    "How did you hear about us?",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {stepIcons.map((Icon, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index + 1 <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {index < stepIcons.length - 1 && (
                  <div
                    className={`h-0.5 w-12 ${
                      index + 1 < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <CardTitle className="text-2xl font-bold">
            {stepTitles[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {TOTAL_STEPS}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...step1Form.register("first_name")}
                    className={
                      step1Form.formState.errors.first_name
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {step1Form.formState.errors.first_name && (
                    <p className="text-destructive text-sm">
                      {step1Form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...step1Form.register("last_name")}
                    className={
                      step1Form.formState.errors.last_name
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {step1Form.formState.errors.last_name && (
                    <p className="text-destructive text-sm">
                      {step1Form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry="US"
                  placeholder="Enter phone number"
                  value={step1Form.watch("phone")}
                  onChange={(value) => step1Form.setValue("phone", value || "")}
                  className={
                    step1Form.formState.errors.phone ? "border-destructive" : ""
                  }
                />
                {step1Form.formState.errors.phone && (
                  <p className="text-destructive text-sm">
                    {step1Form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  {...step2Form.register("business_name")}
                  className={
                    step2Form.formState.errors.business_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {step2Form.formState.errors.business_name && (
                  <p className="text-destructive text-sm">
                    {step2Form.formState.errors.business_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <select
                  id="business_type"
                  {...step2Form.register("business_type")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${
                    step2Form.formState.errors.business_type
                      ? "border-destructive"
                      : ""
                  }`}
                >
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {step2Form.formState.errors.business_type && (
                  <p className="text-destructive text-sm">
                    {step2Form.formState.errors.business_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_size">Business Size *</Label>
                <select
                  id="business_size"
                  {...step2Form.register("business_size")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${
                    step2Form.formState.errors.business_size
                      ? "border-destructive"
                      : ""
                  }`}
                >
                  <option value="">Select business size</option>
                  {BUSINESS_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
                {step2Form.formState.errors.business_size && (
                  <p className="text-destructive text-sm">
                    {step2Form.formState.errors.business_size.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, etc."
                  {...step2Form.register("industry")}
                />
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This information helps us provide better recommendations
                (optional).
              </p>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    placeholder="https://yourwebsite.com"
                    {...step3Form.register("website_url")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <PhoneInput
                    id="business_phone"
                    international
                    defaultCountry="US"
                    placeholder="Enter business phone number"
                    value={step3Form.watch("business_phone")}
                    onChange={(value) =>
                      step3Form.setValue("business_phone", value || "")
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Street"
                      {...step3Form.register("business_address.street")}
                    />
                    <Input
                      placeholder="City"
                      {...step3Form.register("business_address.city")}
                    />
                    <Input
                      placeholder="State"
                      {...step3Form.register("business_address.state")}
                    />
                    <Input
                      placeholder="Zip Code"
                      {...step3Form.register("business_address.zip")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Social Media (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Instagram URL"
                      {...step3Form.register("social_media_urls.instagram")}
                    />
                    <Input
                      placeholder="Facebook URL"
                      {...step3Form.register("social_media_urls.facebook")}
                    />
                    <Input
                      placeholder="TikTok URL"
                      {...step3Form.register("social_media_urls.tiktok")}
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

          {currentStep === 4 && (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="how_heard_about_us">
                  How did you hear about us? *
                </Label>
                <select
                  id="how_heard_about_us"
                  {...step4Form.register("how_heard_about_us")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${
                    step4Form.formState.errors.how_heard_about_us
                      ? "border-destructive"
                      : ""
                  }`}
                >
                  <option value="">Select an option</option>
                  {HOW_HEARD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {step4Form.formState.errors.how_heard_about_us && (
                  <p className="text-destructive text-sm">
                    {step4Form.formState.errors.how_heard_about_us.message}
                  </p>
                )}
              </div>

              {step4Form.watch("how_heard_about_us") === "referral" && (
                <div className="space-y-2">
                  <Label htmlFor="referral_source">Who referred you?</Label>
                  <Input
                    id="referral_source"
                    placeholder="Name or company"
                    {...step4Form.register("referral_source")}
                  />
                </div>
              )}
            </form>
          )}

          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={handleNext} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === TOTAL_STEPS ? "Complete" : "Next"}
                {currentStep < TOTAL_STEPS && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
