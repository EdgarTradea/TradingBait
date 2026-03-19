import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';

export interface WeeklyReview {
  review_id: string;
  user_id: string;
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
  habit_metrics: any[];
  improvement_metrics: any[];
  created_at: string;
}

interface Props {
  review: WeeklyReview;
  onClick: () => void;
}

export function WeeklyReviewCard({ review, onClick }: Props) {
  const winRate = review.total_trades > 0 
    ? ((review.wins / review.total_trades) * 100).toFixed(1) 
    : '0.0';
  
  const isProfitable = review.total_pnl >= 0;

  return (
    <Card 
      className="glassmorphic-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 hover:border-green-500/50 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            <CardTitle className="text-lg font-bold text-gray-100">
              {format(new Date(review.start_date), 'MMM d')} - {format(new Date(review.end_date), 'MMM d, yyyy')}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={isProfitable ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}
          >
            {isProfitable ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            ${review.total_pnl.toFixed(2)}
          </Badge>
        </div>
        <CardDescription className="text-gray-400 text-sm">
          Week of {format(new Date(review.start_date), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{review.total_trades}</div>
            <div className="text-xs text-gray-400">Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{review.trading_days}</div>
            <div className="text-xs text-gray-400">Days</div>
          </div>
        </div>

        {/* Win/Loss Breakdown */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            {review.wins}W
          </Badge>
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            {review.losses}L
          </Badge>
          {review.break_even > 0 && (
            <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
              {review.break_even}BE
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <Button 
          variant="ghost" 
          className="w-full text-gray-300 hover:text-white hover:bg-gray-700/50 group-hover:bg-green-500/10 group-hover:text-green-400"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Full Review
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
