import React, { useMemo, Suspense } from 'react';
import { LoadingSpinner } from './LoadingFallback';

// Lazy load chart components for better bundle splitting
const LineChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);
const Line = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);
const XAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);
const YAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);
const CartesianGrid = React.lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);
const Tooltip = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);
const ResponsiveContainer = React.lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

interface OptimizedChartProps {
  data: Array<{ date: string; 'Net PNL ($)': number }>;
  height?: number;
  className?: string;
}

// Optimized chart component with lazy loading and memoization
export const OptimizedChart = React.memo(({ data, height = 300, className }: OptimizedChartProps) => {
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    // Limit data points for performance (show last 100 trades max)
    return data.slice(-100);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <Suspense fallback={<LoadingSpinner />}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="Net PNL ($)" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
});

OptimizedChart.displayName = 'OptimizedChart';