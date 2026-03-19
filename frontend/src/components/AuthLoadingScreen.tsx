import React from "react";
import { motion } from "framer-motion";
import { Loader2, Shield } from "lucide-react";

/**
 * Loading screen shown while authentication state is being determined
 * Matches the app's dark glassmorphic design system
 */
export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glassmorphic card */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center space-y-6">
            {/* Icon with pulse animation */}
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-lg" />
              <Shield className="relative z-10 w-12 h-12 text-emerald-400" />
            </motion.div>
            
            {/* Loading spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-blue-400" />
            </motion.div>
            
            {/* Loading text */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Securing your session
              </h3>
              <p className="text-gray-400 text-sm">
                Verifying your authentication...
              </p>
            </div>
            
            {/* Animated dots */}
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
