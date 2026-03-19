import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface Props {
  className?: string;
  height?: number;
  color?: 'green' | 'red' | 'blue';
}

export const AnimatedTradingChart: React.FC<Props> = React.memo(({ 
  className = '', 
  height = 200,
  color = 'green'
}) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isPositive, setIsPositive] = useState(true);

  const colorMap = {
    green: {
      line: 'stroke-emerald-400',
      gradient: 'from-emerald-400/20 to-transparent',
      glow: 'shadow-emerald-400/50'
    },
    red: {
      line: 'stroke-red-400', 
      gradient: 'from-red-400/20 to-transparent',
      glow: 'shadow-red-400/50'
    },
    blue: {
      line: 'stroke-blue-400',
      gradient: 'from-blue-400/20 to-transparent', 
      glow: 'shadow-blue-400/50'
    }
  };

  // Optimize data generation
  const generateInitialData = useCallback(() => {
    const points: DataPoint[] = [];
    let currentPrice = 100;
    
    for (let i = 0; i < 30; i++) { // Reduced from 50 to 30 points
      const volatility = 0.015; // Reduced volatility
      const change = (Math.random() - 0.5) * volatility;
      currentPrice = currentPrice * (1 + change);
      
      points.push({
        x: i * 3, // Increased spacing
        y: currentPrice,
        timestamp: Date.now() - (30 - i) * 1000
      });
    }
    
    return points;
  }, []);

  // Generate realistic trading data
  useEffect(() => {
    setDataPoints(generateInitialData());

    // Add new data points with longer intervals
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        const volatility = 0.01; // Reduced volatility
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = lastPoint.y * (1 + change);
        
        const newPoint: DataPoint = {
          x: lastPoint.x + 3,
          y: newPrice,
          timestamp: Date.now()
        };

        setIsPositive(newPrice > lastPoint.y);
        
        // Keep only last 30 points
        return [...prev.slice(-29), newPoint];
      });
    }, 2500); // Increased interval to 2.5 seconds

    return () => clearInterval(interval);
  }, [generateInitialData]);

  // Normalize data for SVG viewport
  const normalizeData = (points: DataPoint[]) => {
    if (points.length === 0) return [];
    
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const range = maxY - minY || 1;
    
    return points.map((point, index) => ({
      x: (index / (points.length - 1)) * 100,
      y: ((maxY - point.y) / range) * 80 + 10 // 10% padding top/bottom
    }));
  };

  const normalizedPoints = normalizeData(dataPoints);
  
  // Create SVG path
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    const pathData = points.reduce((acc, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '');
    
    return pathData;
  };

  const linePath = createPath(normalizedPoints);
  
  // Create area path for gradient fill
  const createAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    const linePath = createPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    return `${linePath} L ${lastPoint.x} 100 L ${firstPoint.x} 100 Z`;
  };

  const areaPath = createAreaPath(normalizedPoints);
  const currentColor = isPositive ? colorMap.green : colorMap.red;

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={`stop-opacity-30`} stopColor={isPositive ? '#10b981' : '#ef4444'} />
            <stop offset="100%" className="stop-opacity-0" stopColor={isPositive ? '#10b981' : '#ef4444'} />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Main line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="0.5"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Animated dots on line - reduced to last 3 points */}
        {normalizedPoints.slice(-3).map((point, index) => (
          <motion.circle
            key={`${point.x}-${point.y}-${index}`}
            cx={point.x}
            cy={point.y}
            r="0.3"
            fill={isPositive ? '#10b981' : '#ef4444'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [1, 0.5, 1] }}
            transition={{ 
              scale: { duration: 0.3 },
              opacity: { duration: 3, repeat: Infinity }
            }}
          />
        ))}
      </svg>
      
      {/* Price indicator */}
      <div className="absolute top-4 right-4">
        <motion.div 
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isPositive 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5 }}
        >
          {isPositive ? '+' : ''}{((dataPoints[dataPoints.length - 1]?.y || 100) - 100).toFixed(2)}%
        </motion.div>
      </div>
    </div>
  );
});

AnimatedTradingChart.displayName = 'AnimatedTradingChart';
