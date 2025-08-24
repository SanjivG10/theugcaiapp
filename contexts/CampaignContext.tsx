"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { Campaign, VoiceData } from "@/types";

export interface ProductImage {
  id: string;
  file?: File;
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
  campaignId?: string;
  campaignName: string;
  productImages: ProductImage[];
  videoDescription: string;
  numberOfScenes: number;
  campaignObjective: string;
  voice: VoiceData;
  script: string;
  scriptMode?: "ai" | "manual";
  scriptSettings?: {
    tone: string;
    length: string;
    style: string;
  };
  generatedImages: GeneratedImage[];
  selectedImages: string[];
  videoPrompts: VideoPrompt[];
  generatedVideos: GeneratedVideo[];
  finalVideoUrl?: string;
}

type CampaignAction =
  | { type: "SET_CAMPAIGN_ID"; payload: string }
  | { type: "SET_CAMPAIGN_NAME"; payload: string }
  | { type: "ADD_PRODUCT_IMAGE"; payload: ProductImage }
  | { type: "REMOVE_PRODUCT_IMAGE"; payload: string }
  | { type: "SET_VIDEO_DESCRIPTION"; payload: string }
  | { type: "SET_NUMBER_OF_SCENES"; payload: number }
  | { type: "SET_CAMPAIGN_OBJECTIVE"; payload: string }
  | { type: "SET_SELECTED_VOICE"; payload: VoiceData }
  | { type: "SET_SCRIPT"; payload: string }
  | { type: "SET_SCRIPT_MODE"; payload: "ai" | "manual" }
  | {
      type: "SET_SCRIPT_SETTINGS";
      payload: { tone: string; length: string; style: string };
    }
  | { type: "ADD_GENERATED_IMAGE"; payload: GeneratedImage }
  | {
      type: "UPDATE_GENERATED_IMAGE";
      payload: { id: string; updates: Partial<GeneratedImage> };
    }
  | { type: "SET_SELECTED_IMAGES"; payload: string[] }
  | { type: "ADD_VIDEO_PROMPT"; payload: VideoPrompt }
  | {
      type: "UPDATE_VIDEO_PROMPT";
      payload: { id: string; updates: Partial<VideoPrompt> };
    }
  | { type: "ADD_GENERATED_VIDEO"; payload: GeneratedVideo }
  | {
      type: "UPDATE_GENERATED_VIDEO";
      payload: { id: string; updates: Partial<GeneratedVideo> };
    }
  | { type: "SET_FINAL_VIDEO_URL"; payload: string }
  | { type: "LOAD_CAMPAIGN_DATA"; payload: Partial<CampaignState> };

const initialState: CampaignState = {
  campaignName: "",
  productImages: [],
  videoDescription: "",
  numberOfScenes: 3,
  campaignObjective: "",
  voice: {
    voice_id: "",
    name: "",
    category: "",
    preview_url: "",
  },
  script: "",
  generatedImages: [],
  selectedImages: [],
  videoPrompts: [],
  generatedVideos: [],
};

function campaignReducer(
  state: CampaignState,
  action: CampaignAction
): CampaignState {
  switch (action.type) {
    case "SET_CAMPAIGN_ID":
      return { ...state, campaignId: action.payload };

    case "SET_CAMPAIGN_NAME":
      return { ...state, campaignName: action.payload };

    case "ADD_PRODUCT_IMAGE":
      return {
        ...state,
        productImages: [...state.productImages, action.payload],
      };

    case "REMOVE_PRODUCT_IMAGE":
      return {
        ...state,
        productImages: state.productImages.filter(
          (img) => img.id !== action.payload
        ),
      };

    case "SET_VIDEO_DESCRIPTION":
      return { ...state, videoDescription: action.payload };

    case "SET_NUMBER_OF_SCENES":
      return { ...state, numberOfScenes: action.payload };

    case "SET_CAMPAIGN_OBJECTIVE":
      return { ...state, campaignObjective: action.payload };

    case "SET_SELECTED_VOICE":
      return { ...state, voice: action.payload };

    case "SET_SCRIPT":
      return { ...state, script: action.payload };

    case "SET_SCRIPT_MODE":
      return { ...state, scriptMode: action.payload };

    case "SET_SCRIPT_SETTINGS":
      return { ...state, scriptSettings: action.payload };

    case "ADD_GENERATED_IMAGE":
      return {
        ...state,
        generatedImages: [...state.generatedImages, action.payload],
      };

    case "UPDATE_GENERATED_IMAGE":
      return {
        ...state,
        generatedImages: state.generatedImages.map((img) =>
          img.id === action.payload.id
            ? { ...img, ...action.payload.updates }
            : img
        ),
      };

    case "SET_SELECTED_IMAGES":
      return { ...state, selectedImages: action.payload };

    case "ADD_VIDEO_PROMPT":
      return {
        ...state,
        videoPrompts: [...state.videoPrompts, action.payload],
      };

    case "UPDATE_VIDEO_PROMPT":
      return {
        ...state,
        videoPrompts: state.videoPrompts.map((prompt) =>
          prompt.id === action.payload.id
            ? { ...prompt, ...action.payload.updates }
            : prompt
        ),
      };

    case "ADD_GENERATED_VIDEO":
      return {
        ...state,
        generatedVideos: [...state.generatedVideos, action.payload],
      };

    case "UPDATE_GENERATED_VIDEO":
      return {
        ...state,
        generatedVideos: state.generatedVideos.map((video) =>
          video.id === action.payload.id
            ? { ...video, ...action.payload.updates }
            : video
        ),
      };

    case "SET_FINAL_VIDEO_URL":
      return { ...state, finalVideoUrl: action.payload };

    case "LOAD_CAMPAIGN_DATA":
      return { ...state, ...action.payload };

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
  campaignData?: Campaign;
}

export function CampaignProvider({
  children,
  campaignData,
}: CampaignProviderProps) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  // Load campaign data when provided
  useEffect(() => {
    if (campaignData) {
      const loadedData: Partial<CampaignState> = {
        campaignId: campaignData.id,
        campaignName: campaignData.name || "",
      };

      // Load settings if available
      if (campaignData.settings) {
        const settings = campaignData.settings;
        if (settings.videoDescription)
          loadedData.videoDescription = settings.videoDescription;
        if (settings.numberOfScenes)
          loadedData.numberOfScenes = settings.numberOfScenes;
        if (settings.campaignObjective)
          loadedData.campaignObjective = settings.campaignObjective;
      }

      // Load step data if available
      if (campaignData.step_data) {
        const stepData = campaignData.step_data;

        // Load basic info from step 1
        if (stepData.step_1?.voice?.name)
          loadedData.voice = stepData.step_1.voice;
        if (stepData.step_1?.numberOfScenes)
          loadedData.numberOfScenes = stepData.step_1.numberOfScenes;
        if (stepData.step_1?.campaignObjective)
          loadedData.campaignObjective = stepData.step_1.campaignObjective;

        // Load product images from step 1 (saved during setup)
        if (stepData.step_1?.productImages) {
          loadedData.productImages = stepData.step_1.productImages.map(
            (image) => ({
              id: image.id,
              url: image.url,
              name: image.name,
            })
          );
        }

        // Load script from step 2 (matches API response structure)
        if (stepData.step_2?.script) loadedData.script = stepData.step_2.script;
        if (stepData.step_2?.scriptMode)
          loadedData.scriptMode = stepData.step_2.scriptMode;
        if (stepData.step_2?.scriptSettings)
          loadedData.scriptSettings = stepData.step_2.scriptSettings;

        // Legacy: Load product images from step 2 (if stored there for backward compatibility)
        if (stepData.step_2?.productImages && !loadedData.productImages) {
          loadedData.productImages = stepData.step_2.productImages.map(
            (image) => ({
              id: image.id,
              url: image.url,
              name: image.name,
              // Don't include file property for uploaded images
            })
          );
        }

        // Load generated images from step 3
        if (stepData.step_3?.generatedImages)
          loadedData.generatedImages = stepData.step_3.generatedImages;

        // Load selected images from step 4
        if (stepData.step_4?.selectedImages)
          loadedData.selectedImages = stepData.step_4.selectedImages;

        // Load video prompts from step 5
        if (stepData.step_5?.videoPrompts)
          loadedData.videoPrompts = stepData.step_5.videoPrompts;

        // Load generated videos from step 6
        if (stepData.step_6?.generatedVideos)
          loadedData.generatedVideos = stepData.step_6.generatedVideos;

        // Load final video URL from step 7
        if (stepData.step_7?.finalVideoUrl)
          loadedData.finalVideoUrl = stepData.step_7.finalVideoUrl;
      }

      dispatch({ type: "LOAD_CAMPAIGN_DATA", payload: loadedData });
    }
  }, [campaignData]);

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
