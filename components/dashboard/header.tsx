"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CreditBalance } from '@/components/ui/credit-display';
import { CreditPurchaseModal } from '@/components/ui/credit-purchase-modal';
import { API_ENDPOINTS } from '@/constants/urls';
import { Bell, Plus } from 'lucide-react';
import axios from 'axios';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  const { user } = useAuth();
  const [currentCredits, setCurrentCredits] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [showCreditModal, setShowCreditModal] = useState(false);
  
  // Fetch current credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.CREDITS.GET);
        if (response.data.success) {
          setCurrentCredits(response.data.data.credits);
          setSubscriptionPlan(response.data.data.subscription_plan);
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      }
    };
    fetchCredits();
  }, []);

  return (
    <header className="bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {action}
            
            <CreditBalance
              currentCredits={currentCredits}
              onPurchaseClick={() => setShowCreditModal(true)}
            />
            
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        currentCredits={currentCredits}
        subscriptionPlan={subscriptionPlan}
        onPurchaseSuccess={() => {
          // Refresh credits after purchase
          const fetchCredits = async () => {
            try {
              const response = await axios.get(API_ENDPOINTS.CREDITS.GET);
              if (response.data.success) {
                setCurrentCredits(response.data.data.credits);
              }
            } catch (error) {
              console.error("Failed to fetch credits:", error);
            }
          };
          fetchCredits();
          setShowCreditModal(false);
        }}
      />
    </header>
  );
}