"use client";

import { Button } from "@/components/ui/button";
import { URLS } from "@/constants/urls";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Target,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Dashboard", href: URLS.DASHBOARD.HOME, icon: Home },
  { name: "Campaigns", href: URLS.DASHBOARD.CAMPAIGNS, icon: Target },
  { name: "Analytics", href: URLS.DASHBOARD.ANALYTICS, icon: BarChart3 },
  { name: "Profile", href: URLS.DASHBOARD.PROFILE, icon: User },
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { business, getBusiness } = useBusiness();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    getBusiness();
  }, [getBusiness]);

  const handleLogout = async () => {
    await logout();
    router.push(URLS.AUTH.LOGIN);
  };

  return (
    <div
      className={cn(
        "bg-card border-r border-border flex flex-col h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-foreground">AI UGC</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-8 w-8 p-0 hover:bg-accent transition-colors",
              isCollapsed ? "mx-auto" : ""
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0",
              isCollapsed ? "w-10 h-10 text-base" : "w-8 h-8"
            )}
          >
            {user?.first_name?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.subscription_status || "trial"}
                </p>
                {business && business.onboarding_completed ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    isCollapsed ? "justify-center px-2" : ""
                  )}
                  title={isCollapsed ? item.name : ""}
                >
                  <Icon
                    className={cn(
                      "transition-all duration-200",
                      isCollapsed ? "h-6 w-6" : "h-5 w-5"
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start space-x-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:scale-105",
            isCollapsed ? "justify-center px-2" : ""
          )}
          title={isCollapsed ? "Sign out" : ""}
        >
          <LogOut
            className={cn(
              "transition-all duration-200",
              isCollapsed ? "h-6 w-6" : "h-5 w-5"
            )}
          />
          {!isCollapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  );
}
