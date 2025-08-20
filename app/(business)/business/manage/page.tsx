"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/hooks/useBusiness";
import { URLS } from "@/constants/urls";
import {
  Building2,
  Settings,
  Globe,
  Phone,
  MapPin,
  Loader2,
  Edit,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function BusinessManagePage() {
  const { business, loading, getBusiness } = useBusiness();
  const router = useRouter();

  useEffect(() => {
    getBusiness();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No Business Information Found</CardTitle>
              <CardDescription>
                You haven&apos;t set up your business information yet. Let&apos;s get that configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(URLS.BUSINESS.SETUP)}>
                Set Up Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link 
              href={URLS.DASHBOARD.HOME}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Business Management</h1>
            <p className="text-muted-foreground">
              Manage your business information and settings
            </p>
          </div>
          
          <Button onClick={() => router.push(URLS.BUSINESS.SETUP)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Business
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Business Name</h4>
                <p className="text-lg font-semibold">{business.business_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Type</h4>
                  <p className="capitalize">{business.business_type?.replace('_', ' ')}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Size</h4>
                  <p>{business.business_size}</p>
                </div>
              </div>

              {business.industry && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Industry</h4>
                  <p>{business.industry}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    business.onboarding_completed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {business.onboarding_completed ? "Completed" : "In Progress"}
                  </span>
                </div>
                {!business.onboarding_completed && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(URLS.ONBOARDING.START)}
                    >
                      Continue Onboarding
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {business.website_url && (
                <div className="flex items-start space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Website</h4>
                    <a 
                      href={business.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {business.website_url}
                    </a>
                  </div>
                </div>
              )}

              {business.business_phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                    <p>{business.business_phone}</p>
                  </div>
                </div>
              )}

              {business.business_address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                    <div className="text-sm">
                      {business.business_address.street && (
                        <p>{business.business_address.street}</p>
                      )}
                      {(business.business_address.city || business.business_address.state || business.business_address.zip) && (
                        <p>
                          {[
                            business.business_address.city,
                            business.business_address.state,
                            business.business_address.zip
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {business.business_address.country && (
                        <p>{business.business_address.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!business.website_url && !business.business_phone && !business.business_address && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No contact information provided</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => router.push(URLS.BUSINESS.SETUP)}
                  >
                    Add Contact Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          {business.social_media_urls && Object.values(business.social_media_urls).some(Boolean) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Your connected social media accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(business.social_media_urls).map(([platform, url]) => {
                    if (!url) return null;
                    return (
                      <div key={platform} className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium capitalize">
                            {platform[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{platform}</p>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Metrics/Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
              <CardDescription>Key information about your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Account Created</h4>
                  <p className="text-lg font-semibold">
                    {new Date(business.created_at || '').toLocaleDateString()}
                  </p>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p className="text-lg font-semibold">
                    {business.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Onboarding Step</h4>
                  <p className="text-lg font-semibold">
                    {business.onboarding_step || 1} / 4
                  </p>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                  <p className="text-lg font-semibold">
                    {new Date(business.updated_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}