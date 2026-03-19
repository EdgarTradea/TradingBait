import { NavLink } from "react-router-dom";
import { cn } from "utils/cn";
import { 
  HomeIcon, 
  BarChart3Icon, 
  BookOpenIcon, 
  BrainIcon,
  SettingsIcon,
} from "lucide-react";

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const navItems = [
    {
      to: "/dashboard",
      icon: HomeIcon,
      label: "Dashboard",
    },
    {
      to: "/analytics",
      icon: BarChart3Icon,
      label: "Analytics",
    },
    {
      to: "/trading-journal",
      icon: BookOpenIcon,
      label: "Journal",
    },
    {
      to: "/my-trading-coach",
      icon: BrainIcon,
      label: "AI Coach",
    },
    {
      to: "/settings",
      icon: SettingsIcon,
      label: "Settings",
    },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800",
      "sm:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  "text-xs font-medium",
                  isActive
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}