import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp, Lightbulb, Target, Shield, Clock, BarChart3 } from 'lucide-react';
import { useUserGuardContext } from 'app';
import brain from 'utils/brain';
import { getCardClasses, getTextClasses } from 'utils/designSystem';

interface PatternInsight {
  id: string;
  title: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'risk' | 'recommendation';
  description: string;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  aiNarrative?: string;
  recommendedActions: string[];
  estimatedImpact: string;
}

interface ContextualAIInsightsProps {
  trades: any[];
  context: 'overview' | 'risk' | 'advanced' | 'heatmaps';
  className?: string;
  compact?: boolean;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'strength': return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'weakness': return <TrendingDown className="h-4 w-4 text-red-400" />;
    case 'opportunity': return <Target className="h-4 w-4 text-blue-400" />;
    case 'risk': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'recommendation': return <Lightbulb className="h-4 w-4 text-purple-400" />;
    default: return <Brain className="h-4 w-4 text-gray-400" />;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'strength': return 'bg-green-500/10 border-green-500/20 text-green-400';
    case 'weakness': return 'bg-red-500/10 border-red-500/20 text-red-400';
    case 'opportunity': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    case 'risk': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    case 'recommendation': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
  }
};

const getPriorityBadge = (priority: string) => {
  const colors = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-gray-500 text-white'
  };
  return colors[priority as keyof typeof colors] || colors.low;
};

export const ContextualAIInsights: React.FC<ContextualAIInsightsProps> = ({ 
  trades, 
  context, 
  className = '', 
  compact = false 
}) => {
  const { user } = useUserGuardContext();
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Filter insights by context
  const contextualInsights = useMemo(() => {
    const contextFilters = {
      overview: ['performance', 'discipline', 'emotional_regulation'],
      risk: ['risk_management', 'position_sizing', 'discipline'],
      advanced: ['behavioral', 'market_condition', 'timing'],
      heatmaps: ['timing', 'emotional_regulation', 'market_condition']
    };
    
    const relevantCategories = contextFilters[context] || [];
    return insights.filter(insight => 
      relevantCategories.some(cat => insight.category.toLowerCase().includes(cat))
    );
  }, [insights, context]);

  useEffect(() => {
    if (user && trades.length >= 10) {
      generateInsights();
    }
  }, [user, trades, context]);

  const generateInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the new consolidated trading patterns API
      const response = await brain.analyze_trading_patterns({
        pattern_types: getPatternTypesForContext(context),
        minimum_confidence: 0.6,
        include_behavioral: true,
        time_range: 90
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedInsights: PatternInsight[] = data.patterns_found?.map((pattern: any, index: number) => ({
          id: `${context}_${index}`,
          title: pattern.pattern_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: getInsightTypeFromPattern(pattern.pattern_type),
          description: pattern.description,
          confidence: pattern.impact_score || 0.7,
          priority: pattern.confidence_level === 'High' ? 'high' : pattern.confidence_level === 'Medium' ? 'medium' : 'low',
          category: context,
          aiNarrative: pattern.recommendation,
          recommendedActions: pattern.recommendation ? [pattern.recommendation] : [],
          estimatedImpact: pattern.confidence_level || 'moderate'
        })) || [];
        
        setInsights(formattedInsights);
      } else {
        // Fallback to trading performance analysis
        const fallbackResponse = await brain.analyze_trading_performance({
          analysis_type: "patterns",
          time_period: 30,
          include_patterns: true,
          focus_areas: [context]
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackInsights: PatternInsight[] = fallbackData.patterns_identified?.map((pattern: any, index: number) => ({
            id: `fallback_${context}_${index}`,
            title: pattern.pattern_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: getInsightTypeFromPattern(pattern.pattern_type),
            description: pattern.description,
            confidence: pattern.impact_score || 0.7,
            priority: pattern.confidence_level === 'High' ? 'high' : pattern.confidence_level === 'Medium' ? 'medium' : 'low',
            category: context,
            aiNarrative: pattern.recommendation,
            recommendedActions: pattern.recommendation ? [pattern.recommendation] : [],
            estimatedImpact: pattern.confidence_level || 'moderate'
          })) || [];
          
          setInsights(fallbackInsights);
        }
      }
    } catch (err) {
      console.error('Error generating contextual insights:', err);
      setError('Failed to generate AI insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map context to pattern types
  const getPatternTypesForContext = (context: string): string[] => {
    const contextPatternMap: Record<string, string[]> = {
      overview: ['win_rate_consistency', 'performance_trends'],
      risk: ['risk_escalation', 'position_sizing'],
      advanced: ['revenge_trading', 'overtrading', 'timing_issue']
    };
    return contextPatternMap[context] || [];
  };

  // Helper function to map pattern type to insight type
  const getInsightTypeFromPattern = (patternType: string): 'strength' | 'weakness' | 'opportunity' | 'risk' | 'recommendation' => {
    const riskPatterns = ['revenge_trading', 'risk_escalation', 'overtrading'];
    const opportunityPatterns = ['win_rate_consistency', 'performance_trends'];
    
    if (riskPatterns.includes(patternType)) return 'risk';
    if (opportunityPatterns.includes(patternType)) return 'opportunity';
    return 'recommendation';
  };

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  if (loading) {
    return (
      <Card className={`${getCardClasses('default', compact ? 'sm' : 'md')} ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="text-sm text-gray-400">Analyzing patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${getCardClasses('negative', compact ? 'sm' : 'md')} ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={generateInsights}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contextualInsights.length === 0) {
    return (
      <Card className={`${getCardClasses('neutral', compact ? 'sm' : 'md')} ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">
              {trades.length < 10 
                ? 'Need more trades for AI pattern analysis' 
                : 'No specific patterns detected in this context'}
            </span>
            {trades.length >= 10 && (
              <Button
                size="sm"
                variant="outline"
                onClick={generateInsights}
                className="ml-auto"
              >
                <Brain className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {contextualInsights.slice(0, compact ? 2 : 4).map((insight) => {
        const isExpanded = expandedInsights.has(insight.id);
        
        return (
          <Card 
            key={insight.id} 
            className={`${getInsightColor(insight.type)} border transition-all duration-200 hover:shadow-lg`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold text-white">
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getPriorityBadge(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleInsightExpansion(insight.id)}
                  className="shrink-0"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-gray-300 mb-3">
                {insight.description}
              </p>
              
              {isExpanded && (
                <div className="space-y-3 border-t border-gray-700 pt-3">
                  {insight.aiNarrative && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-1">AI Analysis</h4>
                      <p className="text-xs text-gray-300">{insight.aiNarrative}</p>
                    </div>
                  )}
                  
                  {insight.recommendedActions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-1">Recommended Actions</h4>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {insight.recommendedActions.slice(0, 3).map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Impact: {insight.estimatedImpact}</span>
                    <span>Category: {insight.category}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {contextualInsights.length > (compact ? 2 : 4) && (
        <Card className={`${getCardClasses('neutral', 'sm')} border-dashed`}>
          <CardContent className="p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Show all insights or navigate to dedicated view
                setExpandedInsights(new Set(contextualInsights.map(i => i.id)));
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              View {contextualInsights.length - (compact ? 2 : 4)} more insights
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContextualAIInsights;
