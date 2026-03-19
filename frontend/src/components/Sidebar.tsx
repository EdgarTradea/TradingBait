import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChartIcon,
  HomeIcon,
  LineChartIcon,
  SettingsIcon,
  PanelLeftClose,
  PanelRightClose,
  PenToolIcon,
  Shield,
  Activity,
} from "lucide-react";
import { TradingBaitLogo } from "components/TradingBaitLogo";
import { useStore } from "utils/store";
import { Button } from "@/components/ui/button";
import { cn } from "utils/cn";
import brain from "utils/brain";
import { getCardClasses, getTextClasses, colors } from "utils/designSystem";

// Memoize Sidebar to prevent unnecessary re-renders
export const Sidebar = React.memo(() => {
  const { isSidebarCollapsed, toggleSidebar } = useStore();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await brain.test_admin();
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        // Silently fail - non-admin users don't need to see errors
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <div
      className={cn(
        "hidden lg:block fixed inset-y-0 left-0 z-10 transition-all",
        "backdrop-blur-xl border-r border-gray-700/50",
        "bg-gradient-to-b from-gray-900/95 via-slate-900/90 to-gray-950/95",
        isSidebarCollapsed ? "w-14" : "w-64",
      )}
      data-tour="sidebar"
    >
      <div className="flex h-full min-h-screen flex-col gap-2">
        {/* Header with logo */}
        <div className="flex h-14 items-center border-b border-gray-700/50 px-4 bg-gradient-to-r from-gray-800/50 to-slate-800/50">
          <NavLink
            className="flex items-center gap-2 font-bold text-white hover:text-blue-300 transition-colors"
            to="/dashboard"
          >
            {isSidebarCollapsed ? (
              <TradingBaitLogo variant="icon" size="md" />
            ) : (
              <TradingBaitLogo variant="default" size="md" />
            )}
          </NavLink>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium space-y-1">
            <NavLink
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                  : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
              )}
              to="/dashboard"
            >
              <HomeIcon className="h-4 w-4 relative z-10" />
              {!isSidebarCollapsed && <span className="font-medium relative z-10">Dashboard</span>}
            </NavLink>
            
            <NavLink
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                  : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
              )}
              to="/trades"
            >
              <BarChartIcon className="h-4 w-4 relative z-10" />
              {!isSidebarCollapsed && <span className="font-medium relative z-10">Trades</span>}
            </NavLink>
            
            <NavLink
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                  : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
              )}
              to="/analytics"
            >
              <LineChartIcon className="h-4 w-4 relative z-10" />
              {!isSidebarCollapsed && <span className="font-medium relative z-10">Analytics</span>}
            </NavLink>
            
            <NavLink
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                  : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
              )}
              to="/trading-journal"
            >
              <PenToolIcon className="h-4 w-4 relative z-10" />
              {!isSidebarCollapsed && <span className="font-medium relative z-10">Trading Journal</span>}
            </NavLink>
            
            {isAdmin && (
              <NavLink
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                    : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
                )}
                to="/admin-dashboard"
              >
                <Shield className="h-4 w-4 relative z-10" />
                {!isSidebarCollapsed && <span className="font-medium relative z-10">Admin Dashboard</span>}
              </NavLink>
            )}
            
            {isAdmin && (
              <NavLink
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                    : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
                )}
                to="/business-analytics"
              >
                <Activity className="h-4 w-4 relative z-10" />
                {!isSidebarCollapsed && <span className="font-medium relative z-10">Business Analytics</span>}
              </NavLink>
            )}
            
            <NavLink
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/40 shadow-lg shadow-blue-500/20" 
                  : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-slate-800/30"
              )}
              to="/settings"
            >
              <SettingsIcon className="h-4 w-4 relative z-10" />
              {!isSidebarCollapsed && <span className="font-medium relative z-10">Settings</span>}
            </NavLink>
          </nav>
        </div>
        
        {/* Footer toggle button */}
        <div className="mt-auto flex flex-col items-center gap-2 p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-slate-800/30">
          <Button
            onClick={toggleSidebar}
            size="icon"
            variant="outline"
            className="w-full h-10 bg-gradient-to-r from-gray-800/80 to-slate-800/80 hover:from-gray-700/80 hover:to-slate-700/80 border-gray-600/50 hover:border-gray-500/50 text-white hover:text-blue-300 transition-all duration-300 backdrop-blur-sm"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
