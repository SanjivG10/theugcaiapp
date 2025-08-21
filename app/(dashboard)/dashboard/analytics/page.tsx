"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Video,
  Image as ImageIcon,
  FileText,
  Zap,
  Calendar,
  Download,
  Eye,
  Heart,
  Share,
  Users,
  Clock,
  Target,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalCreditsUsed: number;
    totalCampaigns: number;
    totalVideos: number;
    totalImages: number;
    changeCredits: number;
    changeCampaigns: number;
    changeVideos: number;
    changeImages: number;
  };
  creditUsage: {
    date: string;
    scripts: number;
    images: number;
    videos: number;
    prompts: number;
  }[];
  campaignPerformance: {
    id: string;
    name: string;
    status: "active" | "completed" | "draft";
    views: number;
    engagement: number;
    creditsUsed: number;
    createdAt: string;
  }[];
  topPerforming: {
    video: {
      name: string;
      views: number;
      likes: number;
      shares: number;
      thumbnail: string;
    };
    campaign: {
      name: string;
      totalViews: number;
      avgEngagement: number;
      creditsUsed: number;
    };
  };
}

// Dummy data generator
const generateDummyData = (): AnalyticsData => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split("T")[0],
      scripts: Math.floor(Math.random() * 8) + 1,
      images: Math.floor(Math.random() * 15) + 2,
      videos: Math.floor(Math.random() * 5) + 1,
      prompts: Math.floor(Math.random() * 6) + 1,
    };
  });

  const campaigns = [
    {
      id: "1",
      name: "Summer Product Launch",
      status: "active" as const,
      views: 15420,
      engagement: 8.5,
      creditsUsed: 45,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Brand Awareness Campaign",
      status: "completed" as const,
      views: 32100,
      engagement: 12.3,
      creditsUsed: 78,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      name: "Holiday Special Promo",
      status: "completed" as const,
      views: 8750,
      engagement: 6.2,
      creditsUsed: 32,
      createdAt: "2024-01-08",
    },
    {
      id: "4",
      name: "Q1 Goals Overview",
      status: "draft" as const,
      views: 0,
      engagement: 0,
      creditsUsed: 12,
      createdAt: "2024-01-20",
    },
  ];

  const totalCreditsUsed = last30Days.reduce(
    (sum, day) => sum + day.scripts + day.images * 2 + day.videos * 10 + day.prompts,
    0
  );

  return {
    overview: {
      totalCreditsUsed,
      totalCampaigns: campaigns.length,
      totalVideos: campaigns.reduce((sum, c) => sum + (c.status !== "draft" ? 3 : 0), 0),
      totalImages: campaigns.reduce((sum, c) => sum + (c.status !== "draft" ? 8 : 0), 0),
      changeCredits: 23.5,
      changeCampaigns: 12.0,
      changeVideos: 18.2,
      changeImages: 15.8,
    },
    creditUsage: last30Days,
    campaignPerformance: campaigns,
    topPerforming: {
      video: {
        name: "Product Demo - Summer Collection",
        views: 45230,
        likes: 1205,
        shares: 342,
        thumbnail: "/api/placeholder/400/225",
      },
      campaign: {
        name: "Brand Awareness Campaign",
        totalViews: 32100,
        avgEngagement: 12.3,
        creditsUsed: 78,
      },
    },
  };
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(generateDummyData());
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Header title="Analytics" description="Monitor your campaign performance and credit usage" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <Header
        title="Analytics"
        description="Monitor your campaign performance and credit usage"
        action={
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                  <p className="text-2xl font-bold">{data.overview.totalCreditsUsed}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{data.overview.changeCredits}%</span>
                <span className="text-sm text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{data.overview.totalCampaigns}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{data.overview.changeCampaigns}%</span>
                <span className="text-sm text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Videos Created</p>
                  <p className="text-2xl font-bold">{data.overview.totalVideos}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{data.overview.changeVideos}%</span>
                <span className="text-sm text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Images Generated</p>
                  <p className="text-2xl font-bold">{data.overview.totalImages}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <ImageIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{data.overview.changeImages}%</span>
                <span className="text-sm text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Usage Chart Placeholder */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Credit Usage Over Time</span>
              </CardTitle>
              <CardDescription>Daily credit consumption by feature type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Credit usage chart</p>
                  <p className="text-xs text-muted-foreground">Interactive chart would go here</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Scripts (1 credit)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Images (2 credits)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Videos (10 credits)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Prompts (1 credit)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Top Performing</span>
              </CardTitle>
              <CardDescription>Your best performing content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Best Video</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{data.topPerforming.video.name}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{formatNumber(data.topPerforming.video.views)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{formatNumber(data.topPerforming.video.likes)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share className="h-3 w-3" />
                      <span>{formatNumber(data.topPerforming.video.shares)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Best Campaign</h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{data.topPerforming.campaign.name}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Views:</span>
                      <span>{formatNumber(data.topPerforming.campaign.totalViews)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Engagement:</span>
                      <span>{data.topPerforming.campaign.avgEngagement}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Credits:</span>
                      <span>{data.topPerforming.campaign.creditsUsed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Campaign Performance</span>
            </CardTitle>
            <CardDescription>Overview of all your campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Campaign</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Views</th>
                    <th className="text-right py-2">Engagement</th>
                    <th className="text-right py-2">Credits Used</th>
                    <th className="text-right py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaignPerformance.map((campaign) => (
                    <tr key={campaign.id} className="border-b last:border-b-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="text-right py-3">{formatNumber(campaign.views)}</td>
                      <td className="text-right py-3">
                        {campaign.engagement > 0 ? `${campaign.engagement}%` : "-"}
                      </td>
                      <td className="text-right py-3 font-medium">{campaign.creditsUsed}</td>
                      <td className="text-right py-3 text-sm text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}