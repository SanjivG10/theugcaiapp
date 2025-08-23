"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Save, Loader2, Check } from "lucide-react";
import { Campaign } from "@/types/api";

interface ImageSelectionProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function ImageSelection({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: ImageSelectionProps) {
  const generatedImages = (stepData.generated_images as any[]) || [];
  const [selectedImages, setSelectedImages] = useState<string[]>(
    (stepData.selected_images as string[]) || []
  );
  const [isDirty, setIsDirty] = useState(false);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const updated = prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId];
      setIsDirty(true);
      return updated;
    });
  };

  const selectAll = () => {
    setSelectedImages(generatedImages.map(img => img.id));
    setIsDirty(true);
  };

  const clearAll = () => {
    setSelectedImages([]);
    setIsDirty(true);
  };

  const handleNext = async () => {
    await onNext({
      selected_images: selectedImages,
      selected_image_data: generatedImages.filter(img => 
        selectedImages.includes(img.id)
      ),
    });
  };

  const handleSave = async () => {
    await onSave({
      selected_images: selectedImages,
      selected_image_data: generatedImages.filter(img => 
        selectedImages.includes(img.id)
      ),
    });
    setIsDirty(false);
  };

  if (generatedImages.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Selection</CardTitle>
            <CardDescription>
              No images found. Please go back and generate some images first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={onPrevious}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Image Generation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Selection</CardTitle>
          <CardDescription>
            Select the images you want to use in your video. You can select multiple images 
            to create a more dynamic video experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {selectedImages.length} of {generatedImages.length} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={selectedImages.length === generatedImages.length}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={selectedImages.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedImages.map((image, index) => {
                const isSelected = selectedImages.includes(image.id);
                
                return (
                  <Card 
                    key={image.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    <CardContent className="p-3">
                      <div className="relative">
                        <img
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                        
                        {/* Selection indicator */}
                        <div className="absolute top-2 right-2">
                          <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${isSelected 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "bg-white border-gray-300"
                            }
                          `}>
                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                        </div>

                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/10 rounded" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Image {index + 1}
                          </Badge>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleImageSelection(image.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selection Summary */}
            {selectedImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Images Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedImages.map((imageId, index) => {
                      const image = generatedImages.find(img => img.id === imageId);
                      return image ? (
                        <div key={imageId} className="flex items-center gap-3 p-2 bg-muted rounded">
                          <img
                            src={image.url}
                            alt={`Selected ${index + 1}`}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">
                              {image.prompt}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onPrevious} disabled={saving}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Progress
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  onClick={handleNext} 
                  disabled={saving || selectedImages.length === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Video Prompts
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}