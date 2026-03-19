import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, X, Save } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  onSubmit: (reviewData: WeeklyReviewFormData) => Promise<void>;
  onCancel: () => void;
}

export interface WeeklyReviewFormData {
  start_date: string;
  end_date: string;
  trading_days: number;
  total_trades: number;
  good_trades: number;
  bad_trades: number;
  wins: number;
  losses: number;
  break_even: number;
  total_pnl: number;
  emotional_reflection: string;
  trading_reflections: string;
  execution_goals: string;
  habit_metrics: Array<{ name: string; value: string }>;
  improvement_metrics: Array<{ name: string; value: string }>;
  chart_images_base64: string[];
}

export function WeeklyReviewForm({ onSubmit, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Initialize with current week (Monday to Sunday)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
  
  const [startDate, setStartDate] = useState(format(weekStart, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(weekEnd, 'yyyy-MM-dd'));
  
  // Performance Summary
  const [tradingDays, setTradingDays] = useState<number | ''>('');
  const [totalTrades, setTotalTrades] = useState<number | ''>('');
  const [goodTrades, setGoodTrades] = useState<number | ''>('');
  const [badTrades, setBadTrades] = useState<number | ''>('');
  const [wins, setWins] = useState<number | ''>('');
  const [losses, setLosses] = useState<number | ''>('');
  const [breakEven, setBreakEven] = useState<number | ''>('');
  const [totalPnl, setTotalPnl] = useState<number | ''>('');
  
  // Reflections
  const [emotionalReflection, setEmotionalReflection] = useState('');
  const [tradingReflections, setTradingReflections] = useState('');
  const [executionGoals, setExecutionGoals] = useState('');
  
  // Habits & Metrics
  const [habitMetrics, setHabitMetrics] = useState<Array<{ name: string; value: string }>>([]);
  const [improvementMetrics, setImprovementMetrics] = useState<Array<{ name: string; value: string }>>([]);
  
  // Chart images
  const [chartImages, setChartImages] = useState<string[]>([]);
  
  const handleThisWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    setStartDate(format(weekStart, 'yyyy-MM-dd'));
    setEndDate(format(weekEnd, 'yyyy-MM-dd'));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = (event.target.result as string).split(',')[1];
          newImages.push(base64);
          
          if (newImages.length === files.length) {
            setChartImages(prev => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (index: number) => {
    setChartImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const addHabitMetric = () => {
    setHabitMetrics(prev => [...prev, { name: '', value: '' }]);
  };
  
  const updateHabitMetric = (index: number, field: 'name' | 'value', value: string) => {
    setHabitMetrics(prev => prev.map((metric, i) => 
      i === index ? { ...metric, [field]: value } : metric
    ));
  };
  
  const removeHabitMetric = (index: number) => {
    setHabitMetrics(prev => prev.filter((_, i) => i !== index));
  };
  
  const addImprovementMetric = () => {
    setImprovementMetrics(prev => [...prev, { name: '', value: '' }]);
  };
  
  const updateImprovementMetric = (index: number, field: 'name' | 'value', value: string) => {
    setImprovementMetrics(prev => prev.map((metric, i) => 
      i === index ? { ...metric, [field]: value } : metric
    ));
  };
  
  const removeImprovementMetric = (index: number) => {
    setImprovementMetrics(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit({
        start_date: startDate,
        end_date: endDate,
        trading_days: tradingDays === '' ? 0 : tradingDays,
        total_trades: totalTrades === '' ? 0 : totalTrades,
        good_trades: goodTrades === '' ? 0 : goodTrades,
        bad_trades: badTrades === '' ? 0 : badTrades,
        wins: wins === '' ? 0 : wins,
        losses: losses === '' ? 0 : losses,
        break_even: breakEven === '' ? 0 : breakEven,
        total_pnl: totalPnl === '' ? 0 : totalPnl,
        emotional_reflection: emotionalReflection,
        trading_reflections: tradingReflections,
        execution_goals: executionGoals,
        habit_metrics: habitMetrics.filter(m => m.name && m.value),
        improvement_metrics: improvementMetrics.filter(m => m.name && m.value),
        chart_images_base64: chartImages,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-100">Create Weekly Review</CardTitle>
          <CardDescription className="text-gray-400">
            Reflect on your week and set goals for improvement
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-200 font-semibold">Week Period</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleThisWeek}>
                <Calendar className="h-4 w-4 mr-2" />
                This Week
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-gray-300">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-gray-300">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="space-y-4">
            <Label className="text-gray-200 font-semibold">Performance Summary</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="trading_days" className="text-gray-300 text-sm">Trading Days</Label>
                <Input
                  id="trading_days"
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={tradingDays}
                  onChange={(e) => setTradingDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="total_trades" className="text-gray-300 text-sm">Total Trades</Label>
                <Input
                  id="total_trades"
                  type="number"
                  min="0"
                  placeholder="e.g. 25"
                  value={totalTrades}
                  onChange={(e) => setTotalTrades(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="good_trades" className="text-gray-300 text-sm">Good Trades</Label>
                <Input
                  id="good_trades"
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={goodTrades}
                  onChange={(e) => setGoodTrades(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="bad_trades" className="text-gray-300 text-sm">Bad Trades</Label>
                <Input
                  id="bad_trades"
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={badTrades}
                  onChange={(e) => setBadTrades(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="wins" className="text-gray-300 text-sm">Wins</Label>
                <Input
                  id="wins"
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  value={wins}
                  onChange={(e) => setWins(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="losses" className="text-gray-300 text-sm">Losses</Label>
                <Input
                  id="losses"
                  type="number"
                  min="0"
                  placeholder="e.g. 8"
                  value={losses}
                  onChange={(e) => setLosses(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="break_even" className="text-gray-300 text-sm">Break-Even</Label>
                <Input
                  id="break_even"
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={breakEven}
                  onChange={(e) => setBreakEven(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="total_pnl" className="text-gray-300 text-sm">Total P&L ($)</Label>
                <Input
                  id="total_pnl"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1250.50"
                  value={totalPnl}
                  onChange={(e) => setTotalPnl(e.target.value === '' ? '' : Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
              </div>
            </div>
          </div>
          
          {/* Emotional/Psychological Reflection */}
          <div className="space-y-2">
            <Label htmlFor="emotional_reflection" className="text-gray-200 font-semibold">Emotional/Psychological Reflection</Label>
            <Textarea
              id="emotional_reflection"
              value={emotionalReflection}
              onChange={(e) => setEmotionalReflection(e.target.value)}
              placeholder="How did you feel this week? What emotions came up during trading?"
              className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]"
            />
          </div>
          
          {/* Trading Metrics & Reflections */}
          <div className="space-y-2">
            <Label htmlFor="trading_reflections" className="text-gray-200 font-semibold">Trading Metrics & Reflections</Label>
            <Textarea
              id="trading_reflections"
              value={tradingReflections}
              onChange={(e) => setTradingReflections(e.target.value)}
              placeholder="What patterns did you notice? What worked well? What didn't?"
              className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]"
            />
          </div>
          
          {/* Chart Images */}
          <div className="space-y-2">
            <Label className="text-gray-200 font-semibold">Chart Images</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
              {chartImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {chartImages.map((_, index) => (
                    <div key={index} className="relative aspect-video bg-gray-800 rounded border border-gray-700">
                      <img 
                        src={`data:image/png;base64,${chartImages[index]}`} 
                        alt={`Chart ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Trading Execution Goals */}
          <div className="space-y-2">
            <Label htmlFor="execution_goals" className="text-gray-200 font-semibold">Trading Execution Goals for Next Week</Label>
            <Textarea
              id="execution_goals"
              value={executionGoals}
              onChange={(e) => setExecutionGoals(e.target.value)}
              placeholder="What specific goals do you have for next week?"
              className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]"
            />
          </div>
          
          {/* Habit Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-200 font-semibold">Habits/Routine Metrics</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHabitMetric}>
                + Add Metric
              </Button>
            </div>
            {habitMetrics.map((metric, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Metric name (e.g., Morning routine)"
                  value={metric.name}
                  onChange={(e) => updateHabitMetric(index, 'name', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
                <Input
                  placeholder="Value (e.g., 5/7 days)"
                  value={metric.value}
                  onChange={(e) => updateHabitMetric(index, 'value', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHabitMetric(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Improvement Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-200 font-semibold">Personal Improvement Metrics</Label>
              <Button type="button" variant="outline" size="sm" onClick={addImprovementMetric}>
                + Add Metric
              </Button>
            </div>
            {improvementMetrics.map((metric, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Metric name (e.g., Exercise)"
                  value={metric.name}
                  onChange={(e) => updateImprovementMetric(index, 'name', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
                <Input
                  placeholder="Value (e.g., 3 sessions)"
                  value={metric.value}
                  onChange={(e) => updateImprovementMetric(index, 'value', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImprovementMetric(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Weekly Review
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
