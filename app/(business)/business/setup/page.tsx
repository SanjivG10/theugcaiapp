"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness } from "@/hooks/useBusiness";
import { URLS } from "@/constants/urls";
import { 
  BUSINESS_TYPES, 
  BUSINESS_SIZES, 
  type BusinessData 
} from "@/types/business";
import {
  Building2,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

const businessSetupSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_type: z.enum(BUSINESS_TYPES.map(t => t.value) as [string, ...string[]]),
  industry: z.string().optional(),
  business_size: z.enum(BUSINESS_SIZES.map(s => s.value) as [string, ...string[]]),
  website_url: z.string().url().optional().or(z.literal("")),
  business_phone: z.string().optional(),
  business_address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
});

type BusinessSetupData = z.infer<typeof businessSetupSchema>;

export default function BusinessSetupPage() {
  const { business, loading, updateBusiness, getBusiness } = useBusiness();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BusinessSetupData>({
    resolver: zodResolver(businessSetupSchema),
  });

  useEffect(() => {
    getBusiness();
  }, []);

  useEffect(() => {
    if (business) {
      reset({
        business_name: business.business_name || "",
        business_type: business.business_type || BUSINESS_TYPES[0].value,
        industry: business.industry || "",
        business_size: business.business_size || BUSINESS_SIZES[0].value,
        website_url: business.website_url || "",
        business_phone: business.business_phone || "",
        business_address: business.business_address || {
          street: "",
          city: "",
          state: "",
          country: "",
          zip: "",
        },
      });
    }
  }, [business, reset]);

  const onSubmit = async (data: BusinessSetupData) => {
    try {
      await updateBusiness(data);
      router.push(URLS.DASHBOARD.HOME);
    } catch (err) {
      console.error("Failed to update business:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href={URLS.DASHBOARD.HOME}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {business ? "Update Business Information" : "Set Up Your Business"}
            </CardTitle>
            <CardDescription>
              {business 
                ? "Update your business details and preferences"
                : "Tell us about your business to get personalized recommendations"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Basics */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    {...register("business_name")}
                    className={errors.business_name ? "border-destructive" : ""}
                  />
                  {errors.business_name && (
                    <p className="text-destructive text-sm">
                      {errors.business_name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business Type *</Label>
                    <select
                      id="business_type"
                      {...register("business_type")}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${
                        errors.business_type ? "border-destructive" : ""
                      }`}
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.business_type && (
                      <p className="text-destructive text-sm">
                        {errors.business_type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_size">Business Size *</Label>
                    <select
                      id="business_size"
                      {...register("business_size")}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${
                        errors.business_size ? "border-destructive" : ""
                      }`}
                    >
                      {BUSINESS_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                    {errors.business_size && (
                      <p className="text-destructive text-sm">
                        {errors.business_size.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology, Healthcare, Retail"
                    {...register("industry")}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      placeholder="https://yourwebsite.com"
                      {...register("website_url")}
                      className={errors.website_url ? "border-destructive" : ""}
                    />
                    {errors.website_url && (
                      <p className="text-destructive text-sm">
                        {errors.website_url.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Business Phone</Label>
                    <Input
                      id="business_phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register("business_phone")}
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Address</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="123 Main Street"
                      {...register("business_address.street")}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        {...register("business_address.city")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        {...register("business_address.state")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="USA"
                        {...register("business_address.country")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip">Zip Code</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        {...register("business_address.zip")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(URLS.DASHBOARD.HOME)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting || loading}>
                  {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {business ? "Update Business" : "Save Business Info"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}