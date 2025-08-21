"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { API_ENDPOINTS, URLS } from "@/constants/urls";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Zap,
  Video,
  Image,
  FileText,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  User,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  campaign_type: "video" | "image" | "script";
  prompt?: string;
  settings: Record<string, any>;
  output_urls?: string[];
  thumbnail_url?: string;
  credits_used: number;
  estimated_credits: number;
  metadata: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  businesses: {
    name: string;
    id: string;
  };
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CAMPAIGNS.GET(campaignId));
      
      if (response.data.success) {
        setCampaign(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to fetch campaign details");
      router.push(URLS.DASHBOARD.CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign || !confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const response = await axios.delete(API_ENDPOINTS.CAMPAIGNS.DELETE(campaign.id));
      
      if (response.data.success) {
        toast.success("Campaign deleted successfully");
        router.push(URLS.DASHBOARD.CAMPAIGNS);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-5 w-5" />;
      case "in_progress":
        return <Play className="h-5 w-5" />;
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      case "failed":
        return <XCircle className="h-5 w-5" />;
      case "cancelled":
        return <Pause className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "image":
        return <Image className="h-5 w-5" />;
      case "script":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-purple-100 text-purple-800";
      case "image":
        return "bg-pink-100 text-pink-800";
      case "script":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="Campaign Details" description="Loading campaign information..." />
        <div className="p-6 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading campaign details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <Header title="Campaign Not Found" description="The requested campaign could not be found" />
        <div className="p-6 max-w-6xl">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="text-muted-foreground mb-4">Campaign not found</div>
                <Button onClick={() => router.push(URLS.DASHBOARD.CAMPAIGNS)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title={campaign.name}
        description={campaign.description || "Campaign details and generated content"}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(URLS.DASHBOARD.CAMPAIGNS)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(URLS.CAMPAIGN.EDIT(campaign.id))}
            disabled={campaign.status === "in_progress"}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteCampaign}
            disabled={campaign.status === "in_progress"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </Header>

      <div className="p-6 max-w-6xl space-y-6">
        {/* Campaign Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon(campaign.campaign_type)}
                  Campaign Overview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(campaign.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(campaign.status)}
                      <span className="capitalize">{campaign.status.replace("_", " ")}</span>
                    </div>
                  </Badge>
                  <Badge className={getTypeColor(campaign.campaign_type)}>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(campaign.campaign_type)}
                      <span className="capitalize">{campaign.campaign_type}</span>
                    </div>
                  </Badge>
                </div>
              </div>
              {campaign.description && (
                <CardDescription>{campaign.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.prompt && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Prompt</h4>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {campaign.prompt}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Business:</span>
                  <span>{campaign.businesses.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Credits Used:</span>
                  <span>{campaign.credits_used}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
                {campaign.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(campaign.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {Object.keys(campaign.settings || {}).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Settings</h4>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(campaign.settings, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Credits</span>
                  <span className="font-medium">{campaign.estimated_credits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Actual Credits Used</span>
                  <span className="font-medium">{campaign.credits_used}</span>
                </div>
                {campaign.started_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Started At</span>
                    <span className="font-medium">
                      {new Date(campaign.started_at).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(campaign.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Output Files</h4>
                {campaign.output_urls && campaign.output_urls.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.output_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span className="text-sm truncate">File {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={url} download>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No output files available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Preview */}
        {campaign.output_urls && campaign.output_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>Preview of your generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaign.output_urls.map((url, index) => (
                  <div key={index} className="space-y-2">
                    {campaign.campaign_type === "video" ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-48 rounded-lg bg-muted object-cover"
                        poster={campaign.thumbnail_url}
                      />
                    ) : campaign.campaign_type === "image" ? (
                      <img
                        src={url}
                        alt={`Generated content ${index + 1}`}
                        className="w-full h-48 rounded-lg bg-muted object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Output {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={url} download>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {Object.keys(campaign.metadata || {}).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(campaign.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}