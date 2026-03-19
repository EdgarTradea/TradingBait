import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, TrendingUp, TrendingDown, Heart, Target, FileText, ArrowLeft, Image as ImageIcon, Brain, Zap, X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { AppApisWeeklyReviewsWeeklyReviewResponse } from 'types';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DailySummary {
  date: string;
  mood: string;
  habit_completion: number;
}

interface Props {
  review: AppApisWeeklyReviewsWeeklyReviewResponse;
  dailySummaries: DailySummary[];
  chartImages: string[];
  onBack: () => void;
}

// Helper function to safely parse and format dates
const safeFormatDate = (dateString: string | undefined, formatString: string): string => {
  if (!dateString) return 'N/A';
  try {
    // Try to parse as ISO string first
    const date = parseISO(dateString);
    if (isValid(date)) {
      return format(date, formatString);
    }
    // Fallback to new Date()
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) {
      return format(fallbackDate, formatString);
    }
    return dateString; // Return original string if can't parse
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return dateString;
  }
};

export function WeeklyReviewDetail({ review, dailySummaries, chartImages, onBack }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const winRate = review.total_trades > 0 
    ? ((review.wins / review.total_trades) * 100).toFixed(1) 
    : '0.0';
  
  const isProfitable = review.total_pnl >= 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-gray-400 hover:text-gray-100 hover:bg-gray-800/50"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reviews
      </Button>

      {/* Header Card */}
      <Card className="glassmorphic-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-green-400" />
                <CardTitle className="text-2xl font-bold text-gray-100">
                  Week of {safeFormatDate(review.start_date, 'MMM d')} - {safeFormatDate(review.end_date, 'MMM d, yyyy')}
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Created on {safeFormatDate(review.created_at, 'MMM d, yyyy \at h:mm a')}
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-2 ${isProfitable ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
            >
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-2" />
              )}
              ${review.total_pnl.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Metrics */}
      <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{review.total_trades}</div>
              <div className="text-sm text-gray-400 mt-1">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-sm text-gray-400 mt-1">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{review.trading_days}</div>
              <div className="text-sm text-gray-400 mt-1">Trading Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{review.good_trades}</div>
              <div className="text-sm text-gray-400 mt-1">Good Trades</div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-base">
              {review.wins} Wins
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 text-base">
              {review.losses} Losses
            </Badge>
            {review.break_even > 0 && (
              <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-4 py-2 text-base">
                {review.break_even} Break-Even
              </Badge>
            )}
            <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2 text-base">
              {review.bad_trades} Bad Trades
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summaries */}
      {dailySummaries && dailySummaries.length > 0 && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Daily Journal Summaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailySummaries.map((day) => (
                <div 
                  key={day.date} 
                  className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-200">
                      {safeFormatDate(day.date, 'EEE, MMM d')}
                    </div>
                    <div className="text-2xl">{day.mood || '😐'}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Habit Completion: <span className="text-emerald-400 font-semibold">{day.habit_completion.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emotional Reflection */}
      {review.emotional_reflection && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              Emotional/Psychological Reflection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{review.emotional_reflection}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Reflections & Chart Images */}
      {review.trading_reflections && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              Trading Metrics & Reflections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{review.trading_reflections}</p>
            </div>

            {/* Chart Images Gallery */}
            {chartImages && chartImages.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Chart Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chartImages.map((image, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img 
                        src={image}
                        alt={`Chart ${index + 1}`}
                        className="w-full h-auto group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">Click to zoom</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Goals */}
      {review.execution_goals && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-400" />
              Trading Execution Goals for Next Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{review.execution_goals}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Metrics */}
      {review.habit_metrics && review.habit_metrics.length > 0 && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-400" />
              Habits/Routine Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {review.habit_metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <span className="text-gray-300 font-medium">{metric?.name || 'Metric'}</span>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {metric?.value || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Metrics */}
      {review.improvement_metrics && review.improvement_metrics.length > 0 && (
        <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Personal Improvement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {review.improvement_metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <span className="text-gray-300 font-medium">{metric?.name || 'Metric'}</span>
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {metric?.value || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-full bg-gray-900/95 border-gray-700">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-gray-400 hover:text-white z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Chart zoom" 
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
