"use client";

import { Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CREDIT_COSTS, type CreditAction } from "@/constants/credits";

interface CreditDisplayProps {
  action: CreditAction;
  currentCredits: number;
  showInsufficientWarning?: boolean;
  onPurchaseClick?: () => void;
  numberOfScenes: number;
  className?: string;
}

export function CreditDisplay({
  action,
  currentCredits,
  showInsufficientWarning = true,
  onPurchaseClick,
  className = "",
  numberOfScenes,
}: CreditDisplayProps) {
  const requiredCredits = CREDIT_COSTS[action] * numberOfScenes;
  const hasEnoughCredits = currentCredits >= requiredCredits;

  const getActionLabel = (action: CreditAction) => {
    switch (action) {
      case "VIDEO_SCRIPT_GENERATION":
        return "Script Generation";
      case "IMAGE_GENERATION":
        return "Image Generation";
      case "VIDEO_GENERATION":
        return "Video Generation";
      case "VIDEO_PROMPTS_GENERATION":
        return "Prompt Generation";
      default:
        return action;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{requiredCredits}</span>
        <span className="text-xs text-muted-foreground">
          {requiredCredits === 1 ? "credit" : "credits"}
        </span>
      </div>

      {!hasEnoughCredits && showInsufficientWarning && (
        <>
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Insufficient Credits
          </Badge>
          {onPurchaseClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPurchaseClick}
              className="text-xs"
            >
              Buy Credits
            </Button>
          )}
        </>
      )}

      {hasEnoughCredits && (
        <Badge variant="secondary" className="text-xs">
          Ready to {getActionLabel(action)}
        </Badge>
      )}
    </div>
  );
}

interface CreditBalanceProps {
  currentCredits: number;
  className?: string;
  onPurchaseClick?: () => void;
}

export function CreditBalance({
  currentCredits,
  className = "",
  onPurchaseClick,
}: CreditBalanceProps) {
  const isLowCredits = currentCredits < 10;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Zap
          className={`h-4 w-4 ${
            isLowCredits ? "text-red-500" : "text-yellow-500"
          }`}
        />
        <span className="font-medium">{currentCredits}</span>
        <span className="text-sm text-muted-foreground">
          {currentCredits === 1 ? "credit" : "credits"}
        </span>
      </div>

      {isLowCredits && onPurchaseClick && (
        <Button size="sm" onClick={onPurchaseClick} className="text-xs">
          Buy More
        </Button>
      )}
    </div>
  );
}
