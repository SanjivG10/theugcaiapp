"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedImage, useCampaign } from "@/contexts/CampaignContext";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Wand2,
  Edit3,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

interface ImageGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface SceneImageGeneration {
  sceneNumber: number;
  scriptText: string;
  selectedProductImage: string;
  imagePrompt: string;
  isGenerating: boolean;
}

export function ImageGeneration({ onNext, onPrev }: ImageGenerationProps) {
  const { state, dispatch } = useCampaign();
  const scriptParagraphs = state.script.split('\n\n').filter(p => p.trim());
  const totalScenes = state.numberOfScenes;
  
  // Initialize scene generation data
  const [sceneGenerations, setSceneGenerations] = useState<SceneImageGeneration[]>(() => {
    return Array.from({ length: totalScenes }, (_, index) => ({
      sceneNumber: index + 1,
      scriptText: scriptParagraphs[index] || '',
      selectedProductImage: '',
      imagePrompt: '',
      isGenerating: false,
    }));
  });

  const updateSceneGeneration = (sceneNumber: number, updates: Partial<SceneImageGeneration>) => {
    setSceneGenerations(prev => prev.map(scene => 
      scene.sceneNumber === sceneNumber ? { ...scene, ...updates } : scene
    ));
  };

  const generateImage = async (sceneNumber: number) => {
    const scene = sceneGenerations.find(s => s.sceneNumber === sceneNumber);
    if (!scene || !scene.selectedProductImage) {
      toast.error("Please select a product image for this scene");
      return;
    }

    updateSceneGeneration(sceneNumber, { isGenerating: true });

    try {
      // Simulate API call to generate image
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Create mock generated image
      const generatedImage: GeneratedImage = {
        id: Math.random().toString(36).substring(2, 9),
        url: `/api/placeholder/400/400?scene=${sceneNumber}&t=${Date.now()}`,
        sceneNumber,
        prompt: scene.imagePrompt || `${scene.scriptText} featuring the product`,
        approved: false,
      };

      dispatch({ type: "ADD_GENERATED_IMAGE", payload: generatedImage });
      toast.success(`Scene ${sceneNumber} image generated successfully!`);
    } catch (error) {
      toast.error("Failed to generate image. Please try again.");
    } finally {
      updateSceneGeneration(sceneNumber, { isGenerating: false });
    }
  };

  const approveImage = (imageId: string) => {
    dispatch({
      type: "UPDATE_GENERATED_IMAGE",
      payload: { id: imageId, updates: { approved: true } },
    });
    toast.success("Image approved!");
  };

  const rejectImage = (imageId: string) => {
    dispatch({
      type: "UPDATE_GENERATED_IMAGE",
      payload: { id: imageId, updates: { approved: false } },
    });
  };

  const regenerateImage = async (imageId: string) => {
    const image = state.generatedImages.find((img) => img.id === imageId);
    if (!image) return;

    updateSceneGeneration(image.sceneNumber, { isGenerating: true });

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update with new generated image
      const newUrl = `/api/placeholder/400/400?scene=${image.sceneNumber}&t=${Date.now()}`;
      dispatch({
        type: "UPDATE_GENERATED_IMAGE",
        payload: { id: imageId, updates: { url: newUrl, approved: false } },
      });

      toast.success("Image regenerated!");
    } catch (error) {
      toast.error("Failed to regenerate image");
    } finally {
      updateSceneGeneration(image.sceneNumber, { isGenerating: false });
    }
  };

  const approvedImages = state.generatedImages.filter((img) => img.approved);
  const canProceed = approvedImages.length >= Math.min(3, totalScenes);

  const handleNext = () => {
    if (!canProceed) {
      toast.error(`Please generate and approve at least ${Math.min(3, totalScenes)} images to continue`);
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Generate Scene Images
        </h2>
        <p className="text-muted-foreground text-sm">
          Generate images for each scene of your video. Each scene is based on your script and will use one of your product images.
        </p>
      </div>

      {/* Scene Generation Cards */}
      <div className="grid gap-6">
        {sceneGenerations.map((scene, index) => {
          const existingImage = state.generatedImages.find(img => img.sceneNumber === scene.sceneNumber);
          const isGenerating = scene.isGenerating;
          
          return (
            <Card key={scene.sceneNumber} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Badge variant="outline">Scene {scene.sceneNumber}</Badge>
                    <span className="text-base">Scene {scene.sceneNumber} Image Generation</span>
                  </CardTitle>
                  {existingImage?.approved && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Script and Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Script for this scene:</label>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {scene.scriptText || 'No script content for this scene'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Product Image:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {state.productImages.map((image) => (
                          <div
                            key={image.id}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                              scene.selectedProductImage === image.id
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => updateSceneGeneration(scene.sceneNumber, { selectedProductImage: image.id })}
                          >
                            <Image
                              src={image.url}
                              alt={image.name}
                              fill
                              className="object-cover"
                            />
                            {scene.selectedProductImage === image.id && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Image Description (optional):
                      </label>
                      <Textarea
                        placeholder="Describe how you want this scene to look..."
                        value={scene.imagePrompt}
                        onChange={(e) => updateSceneGeneration(scene.sceneNumber, { imagePrompt: e.target.value })}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                    
                    <Button
                      onClick={() => generateImage(scene.sceneNumber)}
                      disabled={!scene.selectedProductImage || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      {existingImage ? 'Regenerate Image' : 'Generate Image'}
                    </Button>
                  </div>
                  
                  {/* Right: Generated Image */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Generated Image:</label>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                      {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-sm text-muted-foreground">Generating image...</p>
                          </div>
                        </div>
                      ) : existingImage ? (
                        <div className="relative h-full">
                          <Image
                            src={existingImage.url}
                            alt={`Scene ${scene.sceneNumber}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Click generate to create image</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {existingImage && (
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant={existingImage.approved ? "default" : "outline"}
                          onClick={() => approveImage(existingImage.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {existingImage.approved ? 'Approved' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateImage(existingImage.id)}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">
                {totalScenes}
              </div>
              <p className="text-sm text-muted-foreground">Total Scenes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {state.generatedImages.length}
              </div>
              <p className="text-sm text-muted-foreground">Generated</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {approvedImages.length}
              </div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="px-8">
          Next: Select Images ({approvedImages.length} approved)
        </Button>
      </div>
    </div>
  );
}
