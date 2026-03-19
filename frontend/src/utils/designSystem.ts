import { cn } from "utils/cn";

// Neo-brutalist color system
export const colors = {
  gradients: {
    background: "bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950",
    card: {
      positive: "from-emerald-500/30 via-green-500/20 to-emerald-600/30 border-emerald-500/60 shadow-emerald-500/20",
      negative: "from-red-500/30 via-rose-500/20 to-red-600/30 border-red-500/60 shadow-red-500/20", 
      neutral: "from-blue-500/30 via-cyan-500/20 to-blue-600/30 border-blue-500/60 shadow-blue-500/20",
      default: "from-slate-800/50 via-gray-800/30 to-slate-900/50 border-gray-600/40 shadow-gray-500/10"
    },
    text: {
      primary: "bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent",
      positive: "bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent",
      negative: "bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent",
      neutral: "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent",
      accent: "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
    }
  },
  accents: {
    emerald: "text-emerald-400",
    red: "text-red-400", 
    blue: "text-blue-400",
    purple: "text-purple-400"
  }
};

// Background effects
export const backgroundEffects = {
  radialBlue: "absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none",
  radialEmerald: "absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none",
  radialPurple: "absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.08),transparent_60%)] pointer-events-none"
};

// Neo-brutalist card classes
export const cardStyles = {
  base: "backdrop-blur-xl rounded-2xl border shadow-2xl relative overflow-hidden",
  padding: {
    sm: "p-3",
    md: "p-4", 
    lg: "p-6",
    xl: "p-8"
  },
  hover: "hover:shadow-3xl hover:scale-[1.02] transition-all duration-300"
};

// Typography scales
export const typography = {
  hero: "text-3xl font-black tracking-tight",
  title: "text-2xl font-bold tracking-tight",
  subtitle: "text-lg font-semibold",
  body: "text-sm font-medium",
  caption: "text-xs font-medium uppercase tracking-wider",
  metric: "text-2xl font-black",
  metricLarge: "text-4xl font-black"
};

// Animation classes
export const animations = {
  pulse: "animate-pulse",
  pulseGlow: "animate-pulse shadow-lg",
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up"
};

// Utility functions
export const getCardClasses = (variant: 'positive' | 'negative' | 'neutral' | 'default' = 'default', size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  return cn(
    cardStyles.base,
    cardStyles.padding[size],
    `bg-gradient-to-br ${colors.gradients.card[variant]}`,
    cardStyles.hover
  );
};

export const getTextClasses = (variant: 'primary' | 'positive' | 'negative' | 'neutral' | 'accent' = 'primary', size: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'metric' | 'metricLarge' = 'body') => {
  return cn(
    typography[size],
    colors.gradients.text[variant]
  );
};

export const getBackgroundClasses = () => {
  return cn(
    "min-h-screen relative overflow-hidden",
    colors.gradients.background
  );
};

// Live indicator component props
export const liveIndicatorClasses = {
  container: "flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600/30 to-green-600/30 border border-emerald-500/40 backdrop-blur-xl shadow-lg",
  dot: "w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50",
  text: "text-xs font-bold text-emerald-300 uppercase tracking-wider"
};
