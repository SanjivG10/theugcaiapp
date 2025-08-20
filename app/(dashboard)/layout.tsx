"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { URLS } from "@/constants/urls";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { getBusiness, getOnboardingProgress } = useBusiness();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const hasCheckedOnboarding = useRef(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(URLS.AUTH.LOGIN);
    }
  }, [user, authLoading, router]);

  // Check onboarding completion for all dashboard routes
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading || !user?.id || hasCheckedOnboarding.current) {
        setChecking(false);
        return;
      }

      try {
        hasCheckedOnboarding.current = true;

        // Fetch business and onboarding progress
        await Promise.all([getBusiness(), getOnboardingProgress()]);

        // Check if user needs to complete onboarding
        if (!user.onboarding_completed) {
          router.push(URLS.ONBOARDING.START);
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
