"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { Campaign, VoiceData, Json } from "@/types";

// Updated interfaces to match new campaign structure
export interface AudioData {
  previewUrl?: string;
  id?: string;
  metadata?: Json;
}

export interface ImageData {
  name?: string;
  url?: string;
  isProcessing?: boolean;
}

export interface VideoData {
  prompt?: string;
  url?: string;
  isProcessing?: boolean;
}

export interface SceneData {
  scene_number: number;
  scene_script?: string;
  audio?: AudioData;
  image?: ImageData;
  video?: VideoData;
}

export interface ScriptData {
  tone: string;
  style: string;
  prompt: string;
}

export interface CampaignState {
  // Basic campaign info
  campaignId?: string;
  campaignName: string;
  description: string;
  scenesNumber: number;
  status: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  currentStep: number;
  creditsUsed: number;
  finalUrl?: string;
  
  // New structured data that syncs with database
  script?: ScriptData;
  sceneData: SceneData[];

  // Backward compatibility fields for existing components
  videoDescription: string;
  numberOfScenes: number;
  campaignObjective: string;
  voice: VoiceData;
}

type CampaignAction =
  | { type: "SET_CAMPAIGN_ID"; payload: string }
  | { type: "SET_CAMPAIGN_NAME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_SCENES_NUMBER"; payload: number }
  | { type: "SET_STATUS"; payload: "draft" | "in_progress" | "completed" | "failed" | "cancelled" }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CREDITS_USED"; payload: number }
  | { type: "SET_FINAL_URL"; payload: string }
  | { type: "SET_SCRIPT"; payload: ScriptData }
  | { type: "UPDATE_SCENE_DATA"; payload: { sceneNumber: number; data: Partial<SceneData> } }
  | { type: "SET_SCENE_DATA"; payload: SceneData[] }
  | { type: "INITIALIZE_SCENES"; payload: number }
  | { type: "LOAD_CAMPAIGN_DATA"; payload: Campaign }
  // Backward compatibility actions
  | { type: "SET_VIDEO_DESCRIPTION"; payload: string }
  | { type: "SET_NUMBER_OF_SCENES"; payload: number }
  | { type: "SET_CAMPAIGN_OBJECTIVE"; payload: string }
  | { type: "SET_SELECTED_VOICE"; payload: VoiceData };

const initialState: CampaignState = {
  campaignName: "",
  description: "",
  scenesNumber: 1,
  status: "draft",
  currentStep: 1,
  creditsUsed: 0,
  sceneData: [],
  // Backward compatibility
  videoDescription: "",
  numberOfScenes: 1,
  campaignObjective: "",
  voice: {
    voice_id: "",
    name: "",
    category: "",
    preview_url: "",
  },
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

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };

    case "SET_SCENES_NUMBER":
      return { ...state, scenesNumber: action.payload, numberOfScenes: action.payload };

    case "SET_STATUS":
      return { ...state, status: action.payload };

    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };

    case "SET_CREDITS_USED":
      return { ...state, creditsUsed: action.payload };

    case "SET_FINAL_URL":
      return { ...state, finalUrl: action.payload };

    case "SET_SCRIPT":
      return { ...state, script: action.payload };

    case "UPDATE_SCENE_DATA": {
      const { sceneNumber, data } = action.payload;
      return {
        ...state,
        sceneData: state.sceneData.map((scene) =>
          scene.scene_number === sceneNumber ? { ...scene, ...data } : scene
        ),
      };
    }

    case "SET_SCENE_DATA":
      return { ...state, sceneData: action.payload };

    case "INITIALIZE_SCENES":
      return {
        ...state,
        sceneData: Array.from({ length: action.payload }, (_, index) => ({
          scene_number: index + 1,
        })),
      };

    case "LOAD_CAMPAIGN_DATA": {
      const campaign = action.payload;
      return {
        ...state,
        campaignId: campaign.id,
        campaignName: campaign.name,
        description: campaign.description || "",
        scenesNumber: campaign.scenes_number || 1,
        status: campaign.status || "draft",
        currentStep: campaign.current_step || 1,
        creditsUsed: campaign.credits_used || 0,
        finalUrl: campaign.final_url,
        script: campaign.script,
        sceneData: campaign.scene_data || [],
        // Backward compatibility
        videoDescription: campaign.description || "",
        numberOfScenes: campaign.scenes_number || 1,
      };
    }

    // Backward compatibility actions
    case "SET_VIDEO_DESCRIPTION":
      return { ...state, videoDescription: action.payload, description: action.payload };

    case "SET_NUMBER_OF_SCENES":
      return { ...state, numberOfScenes: action.payload, scenesNumber: action.payload };

    case "SET_CAMPAIGN_OBJECTIVE":
      return { ...state, campaignObjective: action.payload };

    case "SET_SELECTED_VOICE":
      return { ...state, voice: action.payload };

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
      dispatch({ type: "LOAD_CAMPAIGN_DATA", payload: campaignData });
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
