import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HomeIcon,
  LineChartIcon,
  PanelLeftIcon,
  SettingsIcon,
  BarChartIcon,
  CreditCard,
  PenToolIcon,
} from "lucide-react";
import { TradingBaitLogo } from "components/TradingBaitLogo";
import { useUserGuardContext } from "app";

// Memoize Header to prevent unnecessary re-renders
export const Header = React.memo(() => {
  const { user } = useUserGuardContext();

  return (
    <header className="flex h-16 items-center gap-4 px-6 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/50 shadow-2xl">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            variant="outline" 
            className="lg:hidden glassmorphic-card border-gray-700/50 hover:border-emerald-500/50 bg-gray-900/80 text-gray-100 hover:text-emerald-400 transition-all duration-300"
          >
            <PanelLeftIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="lg:hidden w-[280px] sm:w-[320px] bg-gray-950/95 border-gray-800/50 backdrop-blur-xl"
        >
          <SheetHeader>
            <SheetTitle className="text-left">
              <TradingBaitLogo variant="default" size="md" />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navigation menu for TradingBait application
            </SheetDescription>
          </SheetHeader>
          <nav className="grid gap-4 text-lg font-medium mt-8">
            <NavLink
              className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
              to="/dashboard"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Dashboard</span>
            </NavLink>
            <NavLink
              className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
              to="/trades"
            >
              <BarChartIcon className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Trades</span>
            </NavLink>
            <NavLink
              className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
              to="/analytics"
            >
              <LineChartIcon className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Analytics</span>
            </NavLink>
            <NavLink
              className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
              to="/trading-journal"
            >
              <PenToolIcon className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Trading Journal</span>
            </NavLink>
            <NavLink
              className="flex items-center gap-4 px-3 py-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-700/50"
              to="/settings"
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="font-semibold tracking-wide">Settings</span>
            </NavLink>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent">
          Command Center
        </h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-full glassmorphic-card border-gray-700/50 hover:border-emerald-500/50 w-10 h-10 bg-gray-900/80 hover:bg-gray-800/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
            size="icon"
            variant="ghost"
          >
            <img
              alt="Avatar"
              className="rounded-full ring-2 ring-gray-700/50 hover:ring-emerald-500/50 transition-all duration-300"
              height="32"
              src={user.photoURL ?? "/placeholder.svg"}
              style={{
                aspectRatio: "32/32",
                objectFit: "cover",
              }}
              width="32"
            />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="glassmorphic-card bg-gray-950/95 border-gray-800/50 backdrop-blur-xl shadow-2xl"
        >
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-100">{user.displayName ?? "My Account"}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700/50" />
          <DropdownMenuItem asChild className="hover:bg-gray-800/50 text-gray-300 hover:text-emerald-400 transition-colors duration-200">
            <NavLink to="/settings" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Subscription</span>
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="hover:bg-gray-800/50 text-gray-300 hover:text-emerald-400 transition-colors duration-200">
            <NavLink to="/settings">
              <span className="font-medium">Settings</span>
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="hover:bg-gray-800/50 text-gray-300 hover:text-emerald-400 transition-colors duration-200">
            <NavLink to="/settings">
              <span className="font-medium">Support</span>
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700/50" />
          <DropdownMenuItem asChild className="hover:bg-red-900/30 text-gray-300 hover:text-red-400 transition-colors duration-200">
            <NavLink to="/logout">
              <span className="font-medium">Logout</span>
            </NavLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
});

Header.displayName = 'Header';
