"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import {
  BusinessData,
  BusinessContextType,
  OnboardingProgress,
  OnboardingStepData,
  BusinessOnboardingData,
} from "@/types/business";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBusiness = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.getBusiness();

      if (response.success && response?.data) {
        setBusiness(response.data);
      } else {
        setBusiness(null);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error ||
            error.message ||
            "Failed to get business"
          : "Failed to get business";
      setError(errorMessage);
      console.error("Get business error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusiness = useCallback(async (data: Partial<BusinessData>) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.updateBusiness(data);

      if (response.success && response.data?.business) {
        setBusiness(response.data.business);
        toast.success("Business information updated successfully!");
      } else {
        const errorMessage = response.message || "Failed to update business";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to update business";

      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 422) {
          errorMessage = "Please check your input and try again";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOnboardingStep = useCallback(
    async (step: number, data: OnboardingStepData) => {
      try {
        setError(null);
        setLoading(true);

        const response = await api.updateOnboardingStep(step, data);

        if (response.success && response.data?.progress) {
          setOnboardingProgress(response.data.progress);
          toast.success(`Step ${step} completed successfully!`);
          // Refresh business data
          await getBusiness();
        } else {
          const errorMessage =
            response.message || "Failed to update onboarding step";
          setError(errorMessage);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to update onboarding step";

        if (error instanceof AxiosError) {
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 422) {
            errorMessage = "Please check your input and try again";
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [getBusiness]
  );

  const skipOnboardingStep = useCallback(
    async (step: number) => {
      try {
        setError(null);
        setLoading(true);

        const response = await api.skipOnboardingStep(step);

        if (response.success && response.data?.progress) {
          setOnboardingProgress(response.data.progress);
          toast.success(`Step ${step} skipped successfully!`);
          // Refresh business data
          await getBusiness();
        } else {
          const errorMessage =
            response.message || "Failed to skip onboarding step";
          setError(errorMessage);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to skip onboarding step";

        if (error instanceof AxiosError) {
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [getBusiness]
  );

  const completeOnboarding = useCallback(
    async (businessData?: BusinessOnboardingData) => {
      try {
        setError(null);
        setLoading(true);

        const response = await api.completeOnboarding(businessData);

        if (response.success && response.data?.progress) {
          setOnboardingProgress(response.data.progress);
          toast.success(
            "Onboarding completed successfully! Welcome aboard! 🎉"
          );
          // Refresh business data
          await getBusiness();
        } else {
          const errorMessage =
            response.message || "Failed to complete onboarding";
          setError(errorMessage);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to complete onboarding";

        if (error instanceof AxiosError) {
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [getBusiness]
  );

  const getOnboardingProgress = useCallback(async () => {
    try {
      setError(null);

      const response = await api.getOnboardingProgress();

      if (response.success && response.data?.progress) {
        setOnboardingProgress(response.data.progress);
      } else {
        setOnboardingProgress({
          current_step: 1,
          completed: false,
        });
      }
    } catch (error: unknown) {
      console.error("Get onboarding progress error:", error);
      setOnboardingProgress({
        current_step: 1,
        completed: false,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: BusinessContextType = {
    business,
    onboardingProgress,
    loading,
    error,
    getBusiness,
    updateBusiness,
    updateOnboardingStep,
    skipOnboardingStep,
    completeOnboarding,
    getOnboardingProgress,
    clearError,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
