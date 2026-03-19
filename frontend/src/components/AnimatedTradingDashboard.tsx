import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingMetric {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
  trend: 'up' | 'down' | 'neutral';
}

interface Props {
  className?: string;
}

const colorMap = {
  green: 'from-emerald-500 to-green-400',
  red: 'from-red-500 to-rose-400',
  blue: 'from-blue-500 to-cyan-400',
  yellow: 'from-yellow-500 to-amber-400',
  purple: 'from-purple-500 to-violet-400'
};

const trendIcons = {
  up: '↗️',
  down: '↘️',
  neutral: '→'
};

export const AnimatedTradingDashboard: React.FC<Props> = React.memo(({ className = '' }) => {
  const [metrics, setMetrics] = useState<TradingMetric[]>([
    { label: 'P&L Today', value: 2847.50, prefix: '$', color: 'green', trend: 'up' },
    { label: 'Win Rate', value: 73.2, suffix: '%', color: 'blue', trend: 'up' },
    { label: 'Active Trades', value: 8, color: 'yellow', trend: 'neutral' },
    { label: 'Risk Level', value: 15.4, suffix: '%', color: 'purple', trend: 'down' },
    { label: 'Daily Volume', value: 124500, prefix: '$', color: 'blue', trend: 'up' },
    { label: 'Avg Hold Time', value: 4.2, suffix: 'h', color: 'green', trend: 'neutral' }
  ]);

  // Optimize updates with useCallback and longer intervals
  const updateMetrics = useCallback(() => {
    setMetrics(prev => prev.map(metric => {
      // Smaller, more realistic changes
      const changePercent = (Math.random() - 0.5) * 0.05; // ±2.5% change
      const newValue = metric.value * (1 + changePercent);
      
      return {
        ...metric,
        value: parseFloat(newValue.toFixed(2)),
        trend: changePercent > 0.01 ? 'up' : changePercent < -0.01 ? 'down' : 'neutral'
      };
    }));
  }, []);

  // Simulate real-time updates with longer intervals for better performance
  useEffect(() => {
    const interval = setInterval(updateMetrics, 3000); // Increased to 3 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Reduce background grid complexity */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 gap-2 h-full">
          {Array.from({ length: 64 }, (_, i) => (
            <motion.div
              key={i}
              className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 4,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: 'loop'
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating KPI Cards with reduced animation frequency */}
      <div className="absolute inset-0 p-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="absolute"
            style={{
              left: `${15 + (index % 3) * 30}%`,
              top: `${20 + Math.floor(index / 3) * 40}%`
            }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ 
              opacity: [0.8, 1, 0.8], 
              y: [-3, 3, -3],
              scale: 1
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, repeatType: 'reverse' },
              y: { duration: 4, repeat: Infinity, repeatType: 'reverse', delay: index * 0.7 },
              scale: { duration: 0.5 }
            }}
          >
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 min-w-[140px] shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">{metric.label}</span>
                <span className="text-lg">{trendIcons[metric.trend]}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={metric.value}
                    className={`text-xl font-bold bg-gradient-to-r ${colorMap[metric.color]} bg-clip-text text-transparent`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reduced animated chart lines */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 2 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            style={{
              width: '200%',
              left: '-100%',
              top: `${35 + i * 30}%`
            }}
            animate={{
              x: ['0%', '100%']
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1
            }}
          />
        ))}
      </div>

      {/* Simplified pulse effects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {Array.from({ length: 2 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute border border-cyan-400/30 rounded-full"
            style={{
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              left: `${-60 - i * 30}px`,
              top: `${-60 - i * 30}px`
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.1, 0.4]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8
            }}
          />
        ))}
      </div>
    </div>
  );
});

AnimatedTradingDashboard.displayName = 'AnimatedTradingDashboard';
