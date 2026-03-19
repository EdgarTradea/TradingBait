import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Sparkles,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import { cn } from 'utils/cn';

interface ObservationData {
  insight: string;
  confidence: number;
}

interface RecommendationData {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface ConfidenceScoreCardProps {
  type: 'observation' | 'recommendation';
  data: ObservationData | RecommendationData;
  maxConfidence?: number;
  className?: string;
}

export function ConfidenceScoreCard({
  type,
  data,
  maxConfidence = 1.0,
  className
}: ConfidenceScoreCardProps) {
  
  const isObservation = type === 'observation';
  const observationData = isObservation ? data as ObservationData : null;
  const recommendationData = !isObservation ? data as RecommendationData : null;
  
  // Get confidence score (only for observations)
  const confidence = observationData?.confidence || 0;
  const confidencePercentage = Math.round(confidence * 100);
  
  // Get confidence level styling
  const getConfidenceConfig = (confidence: number) => {
    if (confidence >= 0.8) {
      return {
        level: 'High Confidence',
        color: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
        progressColor: 'bg-green-500',
        textColor: 'text-green-400',
        icon: <Shield className="w-4 h-4 text-green-400" />
      };
    } else if (confidence >= 0.5) {
      return {
        level: 'Medium Confidence',
        color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
        progressColor: 'bg-yellow-500',
        textColor: 'text-yellow-400',
        icon: <Info className="w-4 h-4 text-yellow-400" />
      };
    } else {
      return {
        level: 'Low Confidence',
        color: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
        progressColor: 'bg-orange-500',
        textColor: 'text-orange-400',
        icon: <AlertTriangle className="w-4 h-4 text-orange-400" />
      };
    }
  };
  
  // Get priority styling for recommendations
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: 'from-red-500/20 to-orange-500/10 border-red-500/30',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />
        };
      case 'medium':
        return {
          color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
          icon: <Target className="w-4 h-4 text-yellow-400" />
        };
      case 'low':
        return {
          color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Sparkles className="w-4 h-4 text-blue-400" />
        };
      default:
        return {
          color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
          badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
          icon: <Brain className="w-4 h-4 text-gray-400" />
        };
    }
  };
  
  const confidenceConfig = isObservation ? getConfidenceConfig(confidence) : null;
  const priorityConfig = !isObservation && recommendationData ? getPriorityConfig(recommendationData.priority) : null;
  
  // Determine card styling
  const cardConfig = isObservation ? confidenceConfig : priorityConfig;
  
  return (
    <Card className={cn(
      `bg-gradient-to-br ${cardConfig?.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {cardConfig?.icon}
            <CardTitle className="text-sm font-medium text-white">
              {isObservation ? 'AI Observation' : 'Recommendation'}
            </CardTitle>
          </div>
          
          {isObservation && confidenceConfig ? (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">
                {confidenceConfig.level}
              </div>
              <div className={`text-lg font-bold ${confidenceConfig.textColor}`}>
                {confidencePercentage}%
              </div>
            </div>
          ) : recommendationData ? (
            <Badge className={`${priorityConfig?.badgeColor} border text-xs px-2 py-1`}>
              {recommendationData.priority} priority
            </Badge>
          ) : null}
        </div>
        
        {/* Confidence Progress Bar (only for observations) */}
        {isObservation && confidenceConfig && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Confidence Level</span>
              {maxConfidence < 1.0 && (
                <span className="text-xs text-gray-500">
                  Max: {Math.round(maxConfidence * 100)}%
                </span>
              )}
            </div>
            <Progress 
              value={confidencePercentage} 
              className="h-2"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-300 leading-relaxed">
          {isObservation ? observationData?.insight : recommendationData?.recommendation}
        </p>
        
        {/* Confidence interpretation (only for observations) */}
        {isObservation && confidenceConfig && (
          <div className="mt-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-2">
              <Brain className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                {confidence >= 0.8 
                  ? "High confidence - based on substantial data patterns"
                  : confidence >= 0.5
                  ? "Medium confidence - emerging patterns detected"
                  : "Low confidence - limited data available for this insight"
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Priority explanation (only for recommendations) */}
        {!isObservation && recommendationData && (
          <div className="mt-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                {recommendationData.priority === 'high'
                  ? "Urgent action recommended - significant impact potential"
                  : recommendationData.priority === 'medium'
                  ? "Moderate importance - implement when possible"
                  : "Low priority - consider for future improvement"
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConfidenceScoreCard;