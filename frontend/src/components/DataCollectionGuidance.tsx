import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  TrendingUp, 
  Heart, 
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { cn } from 'utils/cn';
import { useNavigate } from 'react-router-dom';

interface DataCollectionGuidanceProps {
  guidanceItems: string[];
  scenario: 'A' | 'B' | 'C';
  className?: string;
}

export function DataCollectionGuidance({
  guidanceItems,
  scenario,
  className
}: DataCollectionGuidanceProps) {
  const navigate = useNavigate();
  
  // Get scenario-specific styling and content
  const getScenarioConfig = (scenario: string) => {
    switch (scenario) {
      case 'A':
        return {
          title: 'Start Building Your Data Foundation',
          subtitle: 'Focus on consistent data collection to unlock deeper insights',
          color: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          icon: <Lightbulb className="w-6 h-6 text-orange-400" />,
          urgency: 'high'
        };
      case 'B':
        return {
          title: 'Enhance Your Data Quality',
          subtitle: 'Add more detail to reveal stronger behavioral patterns',
          color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
          icon: <Target className="w-6 h-6 text-yellow-400" />,
          urgency: 'medium'
        };
      case 'C':
        return {
          title: 'Optimize Your Data Collection',
          subtitle: 'Fine-tune your tracking for even better insights',
          color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
          urgency: 'low'
        };
      default:
        return {
          title: 'Improve Your Data Collection',
          subtitle: 'Follow these steps to get better trading insights',
          color: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
          badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
          icon: <BookOpen className="w-6 h-6 text-gray-400" />,
          urgency: 'medium'
        };
    }
  };
  
  // Map guidance items to actionable cards with icons and links
  const getActionableGuidance = (item: string) => {
    const lowerItem = item.toLowerCase();
    
    if (lowerItem.includes('journal') || lowerItem.includes('mood') || lowerItem.includes('market notes')) {
      return {
        icon: <BookOpen className="w-5 h-5 text-blue-400" />,
        action: 'Start Journaling',
        route: '/trading-journal',
        color: 'bg-blue-500/10 border-blue-500/30'
      };
    }
    
    if (lowerItem.includes('trade') || lowerItem.includes('import') || lowerItem.includes('broker')) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-green-400" />,
        action: 'Import Trades',
        route: '/trades',
        color: 'bg-green-500/10 border-green-500/30'
      };
    }
    
    if (lowerItem.includes('habit') || lowerItem.includes('routine') || lowerItem.includes('track')) {
      return {
        icon: <Heart className="w-5 h-5 text-purple-400" />,
        action: 'Track Habits',
        route: '/trading-journal',
        color: 'bg-purple-500/10 border-purple-500/30'
      };
    }
    
    if (lowerItem.includes('daily') || lowerItem.includes('consistent') || lowerItem.includes('regular')) {
      return {
        icon: <Calendar className="w-5 h-5 text-yellow-400" />,
        action: 'Daily Tracking',
        route: '/trading-journal',
        color: 'bg-yellow-500/10 border-yellow-500/30'
      };
    }
    
    // Default guidance
    return {
      icon: <Target className="w-5 h-5 text-gray-400" />,
      action: 'View Dashboard',
      route: '/dashboard',
      color: 'bg-gray-500/10 border-gray-500/30'
    };
  };
  
  const config = getScenarioConfig(scenario);
  
  return (
    <Card className={cn(
      `bg-gradient-to-br ${config.color} backdrop-blur-sm`,
      className
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <CardTitle className="text-lg text-white">
                {config.title}
              </CardTitle>
              <p className="text-sm text-gray-300 mt-1">
                {config.subtitle}
              </p>
            </div>
          </div>
          <Badge className={`${config.badgeColor} border text-xs px-2 py-1`}>
            {config.urgency} priority
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Guidance Items */}
        <div className="space-y-3">
          {guidanceItems.map((item, index) => {
            const actionConfig = getActionableGuidance(item);
            
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${actionConfig.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {actionConfig.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      {item}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(actionConfig.route)}
                      className="text-xs h-8 px-3 hover:bg-white/10 text-gray-300 hover:text-white"
                    >
                      {actionConfig.action}
                      <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Motivational message based on scenario */}
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                {scenario === 'A' 
                  ? 'Every Entry Counts!' 
                  : scenario === 'B'
                  ? 'You\'re Making Great Progress!'
                  : 'You\'re a Data Pro!'
                }
              </h4>
              <p className="text-xs text-gray-300">
                {scenario === 'A'
                  ? 'Start with just 2-3 journal entries and a few trades. Your AI coach will begin finding patterns in as little as a week.'
                  : scenario === 'B'
                  ? 'Your consistent tracking is paying off. Adding more detail will unlock deeper behavioral insights.'
                  : 'Your comprehensive data enables sophisticated analysis. Small improvements can yield significant insights.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataCollectionGuidance;