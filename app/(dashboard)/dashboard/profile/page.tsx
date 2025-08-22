"use client";

import { Header } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
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
import { SUBSCRIPTION_PLANS } from "@/constants/credits";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  Building2,
  Calendar,
  CreditCard,
  Crown,
  Save,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const combinedSchema = z.object({
  // Personal Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  // Business Information
  business_name: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

type CombinedFormData = z.infer<typeof combinedSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { business, getBusiness, updateBusiness } = useBusiness();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CombinedFormData>({
    resolver: zodResolver(combinedSchema),
  });

  useEffect(() => {
    getBusiness();
    fetchCredits();
  }, []);

  useEffect(() => {
    if (user && business) {
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email,
        phone: user.phone || "",
        business_name: business.business_name || "",
        industry: business.industry || "",
        website: business.website_url || "",
      });
    }
  }, [user, business, reset]);

  const fetchCredits = async () => {
    try {
      const response = await api.getCredits();
      if (response.success && response.data) {
        // Type assertion since the server returns different structure than TypeScript types
        const data = response.data;
        setCurrentCredits(data.credits || 0);
        setSubscriptionPlan(data.subscription_plan || "free");
        setSubscriptionStatus(data.subscription_status || "active");
        setSubscriptionExpiry(data.subscription_expires_at || null);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const onSubmit = async (data: CombinedFormData) => {
    try {
      setIsUpdating(true);

      // Update profile data
      const profileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      };

      // Update business data
      const businessData = {
        name: data.business_name,
        industry: data.industry,
        website: data.website,
        description: data.description,
      };

      // Update both profile and business
      await Promise.all([
        updateProfile(profileData),
        updateBusiness(businessData),
      ]);

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const returnUrl = `${window.location.origin}/dashboard/profile`;
      const response = await api.createBillingPortalSession({
        returnUrl,
      });

      if (response.success && response.data?.portal_url) {
        window.location.href = response.data.portal_url;
      } else {
        toast.error("Failed to open billing portal");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast.error("Failed to open billing portal");
    }
  };

  const currentPlan =
    SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS] ||
    SUBSCRIPTION_PLANS.FREE;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Profile"
        description="Manage your account and business information"
      />

      <div className="p-6 max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Combined Profile & Business Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account & Business Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your personal and business information in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        {...register("first_name")}
                        className={
                          errors.first_name ? "border-destructive" : ""
                        }
                      />
                      {errors.first_name && (
                        <p className="text-destructive text-sm">
                          {errors.first_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        {...register("last_name")}
                        className={errors.last_name ? "border-destructive" : ""}
                      />
                      {errors.last_name && (
                        <p className="text-destructive text-sm">
                          {errors.last_name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        className={errors.email ? "border-destructive" : ""}
                        disabled
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        {...register("phone")}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Business Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        {...register("business_name")}
                        className={
                          errors.business_name ? "border-destructive" : ""
                        }
                      />
                      {errors.business_name && (
                        <p className="text-destructive text-sm">
                          {errors.business_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g. Technology, Retail, Healthcare"
                        {...register("industry")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      {...register("website")}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save All Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription & Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Plan</span>
                <Badge variant="secondary" className="text-sm">
                  {currentPlan.name}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge
                  className={`text-sm ${getStatusColor(subscriptionStatus)}`}
                >
                  {subscriptionStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credits</span>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{currentCredits}</span>
                </div>
              </div>

              {subscriptionExpiry && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires</span>
                  <span className="text-sm">
                    {new Date(subscriptionExpiry).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <div>• {currentPlan.monthlyCredits} credits/month</div>
                <div>
                  • ${currentPlan.creditPrice.toFixed(3)} per additional credit
                </div>
              </div>

              <Button
                onClick={handleManageBilling}
                variant="outline"
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
            <CardDescription>Your account details and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Role</span>
                <span className="text-sm capitalize">
                  {user?.role?.replace("_", " ") || "User"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Business Created</span>
                <span className="text-sm">
                  {business?.created_at
                    ? new Date(business.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
