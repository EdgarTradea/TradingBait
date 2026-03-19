import React from 'react';
import { cn } from 'utils/cn';

interface TradingBaitLogoProps {
  variant?: 'default' | 'icon' | 'wordmark' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * TradingBait Logo Component
 * 
 * A flexible logo component that can be displayed in different variants and sizes.
 * Supports icon-only, text-only, and combined layouts.
 */
export const TradingBaitLogo: React.FC<TradingBaitLogoProps> = ({ 
  variant = 'default', 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl', 
    xl: 'text-3xl'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  // Icon component - trading chart visualization
  const TradingIcon = ({ className: iconClassName }: { className?: string }) => (
    <div className={cn(
      "relative rounded-lg bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500 flex items-center justify-center shadow-lg",
      sizeClasses[size],
      iconClassName
    )}>
      <svg 
        viewBox="0 0 16 16" 
        className={cn("text-white", iconSizeClasses[size])}
        fill="currentColor"
      >
        {/* Trading chart bars */}
        <rect x="2" y="10" width="2" height="4" rx="0.5" />
        <rect x="5" y="6" width="2" height="8" rx="0.5" />
        <rect x="8" y="8" width="2" height="6" rx="0.5" />
        <rect x="11" y="4" width="2" height="10" rx="0.5" />
        {/* Trend line */}
        <path 
          d="M2 12 L6 8 L10 10 L14 6" 
          stroke="rgba(255,255,255,0.8)" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <TradingIcon className={className} />;
  }

  if (variant === 'wordmark') {
    return (
      <span className={cn(
        "font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent",
        textSizeClasses[size],
        className
      )}>
        TradingBait
      </span>
    );
  }

  if (variant === 'default') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TradingIcon />
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent",
            textSizeClasses[size]
          )}>
            TradingBait
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-xs text-gray-400 -mt-1 tracking-wider uppercase">
              Trading Psychology
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <TradingIcon />
        <div className="text-center">
          <div className={cn(
            "font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent",
            textSizeClasses[size]
          )}>
            TradingBait
          </div>
          {(size === 'lg' || size === 'xl') && (
            <div className="text-xs text-gray-400 tracking-wider uppercase">
              Trading Psychology
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to default
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TradingIcon />
      <span className={cn(
        "font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent",
        textSizeClasses[size]
      )}>
        TradingBait
      </span>
    </div>
  );
};

export default TradingBaitLogo;
