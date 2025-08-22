"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { URLS } from "@/constants/urls";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated?: () => void;
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema),
  });

  const onSubmit = async (data: CreateCampaignFormData) => {
    try {
      setIsCreating(true);

      const response = await api.createCampaign({
        name: data.name,
        description: data.description,
        // Don&apos;t set campaign_type yet - user will choose in the builder
      });

      if (response.success) {
        const campaignId = response.data.id;
        toast.success("Campaign created successfully!");
        
        // Reset form and close modal
        reset();
        onOpenChange(false);
        
        // Notify parent component
        if (onCampaignCreated) {
          onCampaignCreated();
        }

        // Navigate to campaign builder
        router.push(URLS.CAMPAIGN.EDIT(campaignId));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error("Error creating campaign:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create campaign");
      } else {
        toast.error("Failed to create campaign");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Start by giving your campaign a name. You&apos;ll be able to configure the details in the next step.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Summer Product Launch Video"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
              disabled={isCreating}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this campaign is about..."
              rows={3}
              {...register("description")}
              className={errors.description ? "border-destructive" : ""}
              disabled={isCreating}
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create & Continue
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}