"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

export interface ProductImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  sceneNumber: number;
  prompt: string;
  approved: boolean;
}

export interface VideoPrompt {
  id: string;
  imageId: string;
  prompt: string;
  animationStyle: string;
  duration: number;
}

export interface GeneratedVideo {
  id: string;
  imageId: string;
  url: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
}

export interface CampaignState {
  campaignName: string;
  productImages: ProductImage[];
  videoDescription: string;
  numberOfScenes: number;
  campaignObjective: string;
  selectedVoice: string;
  script: string;
  generatedImages: GeneratedImage[];
  selectedImages: string[];
  videoPrompts: VideoPrompt[];
  generatedVideos: GeneratedVideo[];
  finalVideoUrl?: string;
}

type CampaignAction =
  | { type: "SET_CAMPAIGN_NAME"; payload: string }
  | { type: "ADD_PRODUCT_IMAGE"; payload: ProductImage }
  | { type: "REMOVE_PRODUCT_IMAGE"; payload: string }
  | { type: "SET_VIDEO_DESCRIPTION"; payload: string }
  | { type: "SET_NUMBER_OF_SCENES"; payload: number }
  | { type: "SET_CAMPAIGN_OBJECTIVE"; payload: string }
  | { type: "SET_SELECTED_VOICE"; payload: string }
  | { type: "SET_SCRIPT"; payload: string }
  | { type: "ADD_GENERATED_IMAGE"; payload: GeneratedImage }
  | { type: "UPDATE_GENERATED_IMAGE"; payload: { id: string; updates: Partial<GeneratedImage> } }
  | { type: "SET_SELECTED_IMAGES"; payload: string[] }
  | { type: "ADD_VIDEO_PROMPT"; payload: VideoPrompt }
  | { type: "UPDATE_VIDEO_PROMPT"; payload: { id: string; updates: Partial<VideoPrompt> } }
  | { type: "ADD_GENERATED_VIDEO"; payload: GeneratedVideo }
  | { type: "UPDATE_GENERATED_VIDEO"; payload: { id: string; updates: Partial<GeneratedVideo> } }
  | { type: "SET_FINAL_VIDEO_URL"; payload: string };

const initialState: CampaignState = {
  campaignName: "",
  productImages: [],
  videoDescription: "",
  numberOfScenes: 3,
  campaignObjective: "",
  selectedVoice: "",
  script: "",
  generatedImages: [],
  selectedImages: [],
  videoPrompts: [],
  generatedVideos: [],
};

function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case "SET_CAMPAIGN_NAME":
      return { ...state, campaignName: action.payload };
    
    case "ADD_PRODUCT_IMAGE":
      return { ...state, productImages: [...state.productImages, action.payload] };
    
    case "REMOVE_PRODUCT_IMAGE":
      return { 
        ...state, 
        productImages: state.productImages.filter(img => img.id !== action.payload)
      };
    
    case "SET_VIDEO_DESCRIPTION":
      return { ...state, videoDescription: action.payload };
    
    case "SET_NUMBER_OF_SCENES":
      return { ...state, numberOfScenes: action.payload };
    
    case "SET_CAMPAIGN_OBJECTIVE":
      return { ...state, campaignObjective: action.payload };
    
    case "SET_SELECTED_VOICE":
      return { ...state, selectedVoice: action.payload };
    
    case "SET_SCRIPT":
      return { ...state, script: action.payload };
    
    case "ADD_GENERATED_IMAGE":
      return { ...state, generatedImages: [...state.generatedImages, action.payload] };
    
    case "UPDATE_GENERATED_IMAGE":
      return {
        ...state,
        generatedImages: state.generatedImages.map(img =>
          img.id === action.payload.id ? { ...img, ...action.payload.updates } : img
        )
      };
    
    case "SET_SELECTED_IMAGES":
      return { ...state, selectedImages: action.payload };
    
    case "ADD_VIDEO_PROMPT":
      return { ...state, videoPrompts: [...state.videoPrompts, action.payload] };
    
    case "UPDATE_VIDEO_PROMPT":
      return {
        ...state,
        videoPrompts: state.videoPrompts.map(prompt =>
          prompt.id === action.payload.id ? { ...prompt, ...action.payload.updates } : prompt
        )
      };
    
    case "ADD_GENERATED_VIDEO":
      return { ...state, generatedVideos: [...state.generatedVideos, action.payload] };
    
    case "UPDATE_GENERATED_VIDEO":
      return {
        ...state,
        generatedVideos: state.generatedVideos.map(video =>
          video.id === action.payload.id ? { ...video, ...action.payload.updates } : video
        )
      };
    
    case "SET_FINAL_VIDEO_URL":
      return { ...state, finalVideoUrl: action.payload };
    
    default:
      return state;
  }
}

interface CampaignContextType {
  state: CampaignState;
  dispatch: React.Dispatch<CampaignAction>;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

interface CampaignProviderProps {
  children: ReactNode;
}

export function CampaignProvider({ children }: CampaignProviderProps) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  return (
    <CampaignContext.Provider value={{ state, dispatch }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}