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
  BarChart3,
  FileText,
  Plus,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface DashboardData {
  stats: {
    total_videos: number;
    videos_this_month: number;
    templates_used: number;
    total_views: number;
  };
  recent_videos: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string;
  }>;
  usage: {
    current_plan: string;
    videos_used: number;
    videos_limit: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { getOnboardingProgress } = useBusiness();
  const hasInitialized = useRef(false);

  const initDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Check business information first
      await getOnboardingProgress();

      // Then fetch dashboard data
      const response = await api.getDashboard();
      if (response.success) {
        setData(response.data || null);
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
      title: "Total Videos",
      value: data?.stats.total_videos || 0,
      change: "+12%",
      icon: Video,
    },
    {
      title: "This Month",
      value: data?.stats.videos_this_month || 0,
      change: "+8%",
      icon: TrendingUp,
    },
    {
      title: "Templates Used",
      value: data?.stats.templates_used || 0,
      change: "+4%",
      icon: FileText,
    },
    {
      title: "Total Views",
      value: data?.stats.total_views || 0,
      change: "+23%",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your videos."
        action={
          <Button onClick={() => router.push(URLS.VIDEO.CREATE)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Video
          </Button>
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
          {/* Recent Videos */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Recent Videos</CardTitle>
              <CardDescription>Your latest video creations</CardDescription>
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
              ) : data?.recent_videos?.length ? (
                <div className="space-y-4">
                  {data.recent_videos.map((video) => (
                    <div key={video.id} className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                        <Video className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {video.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            video.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : video.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {video.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    No videos yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating your first AI video.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push(URLS.VIDEO.CREATE)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Video
                    </Button>
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
                  <span>Videos Used</span>
                  <span className="font-medium">
                    {data?.usage?.videos_used || 0} /{" "}
                    {data?.usage?.videos_limit || 10}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        ((data?.usage?.videos_used || 0) /
                          (data?.usage?.videos_limit || 10)) *
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => router.push(URLS.VIDEO.CREATE)}
              >
                <div className="flex items-center space-x-3">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Video</div>
                    <div className="text-sm text-muted-foreground">
                      Start a new AI video
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => router.push(URLS.DASHBOARD.TEMPLATES)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Browse Templates</div>
                    <div className="text-sm text-muted-foreground">
                      Explore video templates
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => router.push(URLS.DASHBOARD.ANALYTICS)}
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-muted-foreground">
                      Check video performance
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
