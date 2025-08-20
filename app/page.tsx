"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { URLS } from "@/constants/urls";
import { Video, Check, ArrowRight, Zap, Users, BarChart3 } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Video className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                AI UGC Platform
              </h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6 max-w-4xl mx-auto">
              Create Viral User-Generated Content Videos with AI in Minutes
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your marketing with AI-powered video creation. Generate
              authentic, engaging UGC videos that convert viewers into
              customers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Button
                  size="lg"
                  onClick={() => router.push(URLS.DASHBOARD.HOME)}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href={URLS.AUTH.LOGIN}>
                      Start Creating Videos
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href={URLS.AUTH.REGISTER}>Sign Up Free</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="flex items-center justify-center space-x-3 p-4 bg-card rounded-lg border">
                <Zap className="h-6 w-6 text-primary" />
                <span className="font-medium">Generate in 5 minutes</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 bg-card rounded-lg border">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-medium">10,000+ happy customers</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 bg-card rounded-lg border">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="font-medium">300% better ROI</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Starter</CardTitle>
                <div className="text-3xl font-bold mt-4">
                  $29
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect for small creators
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">10 videos per month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">HD video quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Basic templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email support</span>
                </div>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href={URLS.AUTH.LOGIN}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Pro</CardTitle>
                <div className="text-3xl font-bold mt-4">
                  $79
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  For growing businesses
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">50 videos per month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">4K video quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All premium templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Analytics dashboard</span>
                </div>
                <Button className="w-full mt-6" asChild>
                  <Link href={URLS.AUTH.LOGIN}>Start Pro Plan</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold mt-4">
                  $199
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  For large organizations
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited videos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom exports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Dedicated support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Team management</span>
                </div>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href={URLS.AUTH.LOGIN}>Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
