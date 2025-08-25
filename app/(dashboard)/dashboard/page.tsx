"use client";

import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { URLS } from "@/constants/urls";
import { useBusiness } from "@/hooks/useBusiness";
import { api } from "@/lib/api";
import {
  Calendar,
  Plus,
  Target,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface DashboardStats {
  total_campaigns: number;
  campaigns_this_month: number;
  active_campaigns: number;
  campaigns_this_week: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent_campaigns: Array<{
    id: string;
    name: string;
    title?: string;
    created_at: string;
    status: string;
  }>;
  usage: {
    current_plan: string;
    campaigns_used: number;
    campaigns_limit: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { getOnboardingProgress } = useBusiness();
  const hasInitialized = useRef(false);

  const initDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Check business information first
      await getOnboardingProgress();

      // Fetch campaign statistics and recent campaigns in parallel
      const [statsResponse, campaignsResponse] = await Promise.all([
        api.getCampaignStats(),
        api.getCampaigns(1)
      ]);

      if (statsResponse.success && statsResponse.data) {
        const statsData = statsResponse.data as unknown as {
          totalCampaigns: number;
          totalCreditsUsed: number;
          statusCounts: Record<string, number>;
          typeCounts: Record<string, number>;
          completionRate: string;
        };

        // Get recent campaigns
        const recentCampaigns = campaignsResponse.success && campaignsResponse.data?.data 
          ? campaignsResponse.data.data.slice(0, 5).map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              title: campaign.name,
              created_at: campaign.created_at || new Date().toISOString(),
              status: campaign.status || 'draft'
            }))
          : [];

        // Calculate dashboard stats from campaign stats
        const dashboardStats: DashboardStats = {
          total_campaigns: statsData.totalCampaigns || 0,
          campaigns_this_month: statsData.totalCampaigns || 0, // This could be refined with date filtering
          active_campaigns: statsData.statusCounts?.in_progress || 0,
          campaigns_this_week: Math.floor((statsData.totalCampaigns || 0) * 0.3) // Approximation
        };

        const dashboardData: DashboardData = {
          stats: dashboardStats,
          recent_campaigns: recentCampaigns,
          usage: {
            current_plan: 'trial', // This could come from user subscription data
            campaigns_used: statsData.totalCampaigns || 0,
            campaigns_limit: 10 // This should come from subscription plan
          }
        };

        setData(dashboardData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [getOnboardingProgress]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initDashboard();
    }
  }, [initDashboard]);

  const stats = [
    {
      title: "Total Campaigns",
      value: data?.stats.total_campaigns || 0,
      change: "+12%",
      icon: Target,
    },
    {
      title: "This Month",
      value: data?.stats.campaigns_this_month || 0,
      change: "+8%",
      icon: TrendingUp,
    },
    {
      title: "Active Campaigns",
      value: data?.stats.active_campaigns || 0,
      change: "+15%",
      icon: Video,
    },
    {
      title: "This Week",
      value: data?.stats.campaigns_this_week || 0,
      change: "+23%",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your campaigns."
        action={
          <Link href={URLS.DASHBOARD.CAMPAIGNS_QUERY_CREATE}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-600">{stat.change}</span> from
                    last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Campaigns */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest campaign creations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-muted rounded animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.recent_campaigns?.length ? (
                <div className="space-y-4">
                  {data.recent_campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center space-x-4"
                    >
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {campaign.title || campaign.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            campaign.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : campaign.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    No campaigns yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating your first AI campaign.
                  </p>
                  <div className="mt-6">
                    <Link href={URLS.DASHBOARD.CAMPAIGNS_QUERY_CREATE}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Current plan usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Plan</span>
                  <span className="font-medium capitalize">
                    {data?.usage?.current_plan || "Trial"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Campaigns Used</span>
                  <span className="font-medium">
                    {data?.usage?.campaigns_used || 0} /{" "}
                    {data?.usage?.campaigns_limit || 10}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        ((data?.usage?.campaigns_used || 0) /
                          (data?.usage?.campaigns_limit || 10)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
