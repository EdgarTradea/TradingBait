import { NavLink } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              TradingBait
            </span>
          </div>

          {/* Center - Legal Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <NavLink 
              to="/privacy-policy" 
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Privacy Policy
            </NavLink>
            <Separator orientation="vertical" className="h-4 bg-gray-700" />
            <NavLink 
              to="/terms-of-service" 
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Terms of Service
            </NavLink>
            <Separator orientation="vertical" className="h-4 bg-gray-700" />
            <NavLink 
              to="/help" 
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Help & Support
            </NavLink>
          </div>

          {/* Right side - Copyright */}
          <div className="text-sm text-gray-400">
            © {currentYear} TradingBait. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
