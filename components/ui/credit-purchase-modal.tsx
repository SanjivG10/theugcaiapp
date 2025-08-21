"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, Check } from "lucide-react";
import {
  CREDIT_PURCHASE_PACKAGES,
  SUBSCRIPTION_PLANS,
} from "@/constants/credits";
import { API_ENDPOINTS } from "@/constants/urls";
import axios from "axios";
import toast from "react-hot-toast";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  subscriptionPlan: string;
  onPurchaseSuccess?: () => void;
}

export function CreditPurchaseModal({
  isOpen,
  onClose,
  currentCredits,
  subscriptionPlan,
  onPurchaseSuccess,
}: CreditPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const plan =
    SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS] ||
    SUBSCRIPTION_PLANS.FREE;

  const handlePurchase = async (credits: number) => {
    setIsLoading(true);
    try {
      const successUrl = `${window.location.origin}/dashboard?purchase=success`;
      const cancelUrl = `${window.location.origin}/dashboard?purchase=cancelled`;

      const response = await axios.post(API_ENDPOINTS.CREDITS.PURCHASE, {
        credits,
        successUrl,
        cancelUrl,
      });

      if (response.data.success && response.data.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to initiate purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (credits: number) => {
    return (credits * plan.creditPrice).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to continue creating amazing content. You
            currently have {currentCredits} credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Current Plan: {plan.name}
                </CardTitle>
                <Badge variant="secondary">
                  ${plan.creditPrice.toFixed(3)} per credit
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                {plan.monthlyCredits} credits per month included
              </div>
            </CardContent>
          </Card>

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CREDIT_PURCHASE_PACKAGES.map((pkg, index) => {
              const price = calculatePrice(pkg.credits);
              const isSelected = selectedPackage === index;
              const isPopular = pkg.credits === 100; // Mark 100 credits as popular

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary" : ""
                  } ${isPopular ? "border-primary" : ""}`}
                  onClick={() => setSelectedPackage(index)}
                >
                  {isPopular && (
                    <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-1 rounded-t-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pkg.label}</CardTitle>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="text-2xl font-bold">${price}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>• {pkg.credits} credits</div>
                      <div>• ${plan.creditPrice.toFixed(3)} per credit</div>
                      <div>• Never expires</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPackage !== null) {
                  handlePurchase(
                    CREDIT_PURCHASE_PACKAGES[selectedPackage].credits
                  );
                }
              }}
              disabled={selectedPackage === null || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : selectedPackage !== null ? (
                `Purchase ${CREDIT_PURCHASE_PACKAGES[selectedPackage].credits} Credits`
              ) : (
                "Select Package"
              )}
            </Button>
          </div>

          {/* Security Note */}
          <div className="text-xs text-muted-foreground text-center">
            <CreditCard className="h-4 w-4 inline mr-1" />
            Secure payment powered by Stripe. Your payment information is
            encrypted and secure.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
