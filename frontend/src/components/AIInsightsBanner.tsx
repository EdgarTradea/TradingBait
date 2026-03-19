import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  AlertCircle,
  Lightbulb, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react'
import brain from 'utils/brain'
import { toast } from 'sonner'
import { useUserGuardContext } from 'app'
import { AnalyticsInsightsRequest, AnalyticsInsightsResponse, BehavioralInsightResult } from 'types'
import {
  TradingAnalysisResponse,
  PatternInsight,
  TradingInsight
} from "types"

interface AIInsight {
  type: string  // insight_type from BehavioralInsightResult
  title: string
  insight: string  // description from BehavioralInsightResult  
  confidence: number  // confidence_score from BehavioralInsightResult
  actionable_steps: string[]  // actionable_recommendation split into array
  category: string
  priority: string
}

interface AIInsightsResponse {
  insights: AIInsight[]
  coaching_summary: string  // ai_summary from AnalyticsInsightsResponse
  confidence_level?: number  // confidence_level from AnalyticsInsightsResponse
  total_trades_analyzed?: number  // total_trades_analyzed from AnalyticsInsightsResponse
}

interface Props {
  trades: any[]
}

interface UsageTracking {
  month: string
  count: number
  lastGenerated?: string
}

const MONTHLY_LIMIT = 20

const getInsightIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'strength':
      return <TrendingUp className="h-5 w-5 text-green-400" />;
    case 'opportunity':
      return <Target className="h-5 w-5 text-blue-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'risk':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Lightbulb className="h-5 w-5 text-purple-400" />;
  }
}

const getInsightColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'strength':
      return 'border-l-4 border-l-green-500 bg-green-500/5';
    case 'opportunity':
      return 'border-l-4 border-l-blue-500 bg-blue-500/5';
    case 'warning':
      return 'border-l-4 border-l-yellow-500 bg-yellow-500/5';
    case 'risk':
      return 'border-l-4 border-l-red-500 bg-red-500/5';
    default:
      return 'border-l-4 border-l-purple-500 bg-purple-500/5';
  }
}

const getInsightBadgeColor = (type: string) => {
  switch (type) {
    case 'strength':
      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'opportunity':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'warning':
    case 'risk':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    default:
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  }
}

// Helper function to parse markdown bold formatting
const parseMarkdownBold = (text: string) => {
  // Split text by **bold** patterns
  const parts = text.split(/(\*\*.*?\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** and make bold
      const boldText = part.slice(2, -2)
      return <strong key={index} className="font-semibold text-gray-300">{boldText}</strong>
    }
    return part
  })
}

export const AIInsightsBanner: React.FC<Props> = ({ trades }) => {
  const { user } = useUserGuardContext()
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [usage, setUsage] = useState<UsageTracking | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false)

  // Get current month key for tracking
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  // Load usage tracking from localStorage
  const loadUsage = () => {
    if (!user) return
    
    const currentMonth = getCurrentMonth()
    const storageKey = `ai_insights_usage_${user.uid}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      const parsedUsage: UsageTracking = JSON.parse(stored)
      // Reset if it's a new month
      if (parsedUsage.month !== currentMonth) {
        const newUsage = { month: currentMonth, count: 0 }
        setUsage(newUsage)
        localStorage.setItem(storageKey, JSON.stringify(newUsage))
      } else {
        setUsage(parsedUsage)
        // Check if we have cached insights from this month
        if (parsedUsage.lastGenerated) {
          const cached = localStorage.getItem(`ai_insights_data_${user.uid}`)
          if (cached) {
            try {
              const cachedData = JSON.parse(cached)
              setInsights(cachedData)
              setLastUpdated(new Date(parsedUsage.lastGenerated))
              setHasGenerated(true)
            } catch (e) {
              console.error('Failed to parse cached insights:', e)
            }
          }
        }
      }
    } else {
      const newUsage = { month: currentMonth, count: 0 }
      setUsage(newUsage)
      localStorage.setItem(storageKey, JSON.stringify(newUsage))
    }
  }

  // Update usage tracking
  const updateUsage = (insightsData: AIInsightsResponse) => {
    if (!user || !usage) return
    
    const now = new Date()
    const updatedUsage = {
      ...usage,
      count: usage.count + 1,
      lastGenerated: now.toISOString()
    }
    
    const storageKey = `ai_insights_usage_${user.uid}`
    localStorage.setItem(storageKey, JSON.stringify(updatedUsage))
    localStorage.setItem(`ai_insights_data_${user.uid}`, JSON.stringify(insightsData))
    
    setUsage(updatedUsage)
    setLastUpdated(now)
  }

  useEffect(() => {
    loadUsage()
  }, [user])

  const loadInsights = async () => {
    if (!usage || usage.count >= MONTHLY_LIMIT) {
      toast.error(`Monthly limit of ${MONTHLY_LIMIT} AI insights reached`)
      return
    }

    try {
      setLoading(true)
      const response = await brain.analyze_trading_performance({
        analysis_type: "comprehensive",
        time_period: 30,
        include_patterns: true,
        include_performance: true,
        include_risk_analysis: true,
        focus_areas: ["behavioral_patterns", "performance_optimization"]
      })
      
      const data: TradingAnalysisResponse = await response.json()
      
      // Transform the TradingAnalysisResponse to match existing AIInsightsResponse structure
      const transformedData: AIInsightsResponse = {
        insights: [
          // Convert patterns to insights
          ...data.patterns_identified.map((pattern: PatternInsight, index: number) => ({
            type: pattern.pattern_type,
            title: pattern.pattern_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            insight: pattern.description,
            confidence: pattern.impact_score || 0.7,
            actionable_steps: pattern.recommendation ? [pattern.recommendation] : [],
            category: pattern.pattern_type,
            priority: pattern.confidence_level === 'High' ? 'high' : pattern.confidence_level === 'Medium' ? 'medium' : 'low'
          })),
          // Convert trading insights
          ...data.trading_insights.map((insight: TradingInsight, index: number) => ({
            type: insight.insight_type,
            title: insight.title,
            insight: insight.description,
            confidence: insight.confidence_score || 0.8,
            actionable_steps: insight.actionable_recommendation ? [insight.actionable_recommendation] : [],
            category: insight.insight_type,
            priority: insight.confidence_score > 0.8 ? 'high' : insight.confidence_score > 0.6 ? 'medium' : 'low'
          }))
        ],
        coaching_summary: data.analysis_summary,
        confidence_level: data.confidence_score,
        total_trades_analyzed: data.key_findings.length // Approximate from key findings
      }
      
      setInsights(transformedData)
      setHasGenerated(true)
      updateUsage(transformedData)
      toast.success('AI insights generated successfully!')
    } catch (error) {
      console.error('Error loading AI insights:', error)
      toast.error('Failed to generate AI insights')
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const remainingCalls = usage ? MONTHLY_LIMIT - usage.count : MONTHLY_LIMIT
  const canGenerate = usage && usage.count < MONTHLY_LIMIT && trades.length >= 20

  // Show insufficient data message
  if (trades.length < 20) {
    return (
      <Card className="border-gray-600/30 bg-gray-700/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-300">AI-Powered Insights</p>
              <p className="text-sm text-gray-400">
                Need {20 - trades.length} more trades to unlock behavioral pattern analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show generation prompt if no insights yet
  if (!hasGenerated) {
    return (
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-purple-300">AI-Powered Trading Insights</h3>
                <p className="text-sm text-purple-400">
                  Generate personalized behavioral analysis from your {trades.length} trades
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Monthly Usage</p>
                <p className="text-sm text-purple-300">{remainingCalls}/{MONTHLY_LIMIT} calls left</p>
              </div>
              <Button 
                onClick={loadInsights}
                disabled={!canGenerate || loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show no insights found
  if (insights && insights.insights.length === 0) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-blue-300">AI Analysis Complete</p>
                <p className="text-sm text-blue-400">
                  {insights.total_trades_analyzed} trades analyzed - no significant behavioral patterns detected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Monthly Usage</p>
                <p className="text-sm text-blue-300">{remainingCalls}/{MONTHLY_LIMIT} calls left</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadInsights}
                disabled={!canGenerate || loading}
                className="text-blue-400 hover:text-blue-300"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show insights
  if (insights && insights.insights.length > 0) {
    return (
      <div className="space-y-4 mb-6">
        {/* Compact Collapsible AI Insights Header */}
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Behavioral Insights</h3>
                  <p className="text-xs text-gray-400">
                    {insights.insights.length} insights
                    {lastUpdated && (
                      <span className="ml-2">• Generated {formatTime(lastUpdated)}</span>
                    )}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-xs text-gray-400">Monthly Usage</p>
                  <p className="text-xs text-purple-300">{remainingCalls}/{MONTHLY_LIMIT} left</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    loadInsights()
                  }}
                  disabled={!canGenerate || loading}
                  className="text-purple-400 hover:text-purple-300 mr-2"
                >
                  {loading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
                <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300">
                  {Math.round((insights.confidence_level || 0.8) * 100)}% confidence
                </Badge>
                <button
                  onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                  className="text-gray-400 hover:text-gray-300 ml-2"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    isInsightsExpanded ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>
          </CardContent>
          
          {/* Expanded Content */}
          {isInsightsExpanded && (
            <CardContent className="pt-0 pb-4">
              <div className="border-t border-gray-600/30 pt-4">
                {/* AI Summary */}
                {insights.coaching_summary && (
                  <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{insights.coaching_summary}</p>
                    </div>
                  </div>
                )}

                {/* Individual Insights */}
                <div className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <Collapsible key={index}>
                      <CollapsibleTrigger asChild>
                        <Card className="cursor-pointer hover:bg-gray-700/30 transition-colors border-gray-600/30">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Severity Icon */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  insight.type === 'strength' ? 'bg-green-500/20 border border-green-500/30' :
                                  insight.type === 'opportunity' ? 'bg-blue-500/20 border border-blue-500/30' :
                                  insight.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                  'bg-red-500/20 border border-red-500/30'
                                }`}>
                                  {insight.type === 'strength' && <TrendingUp className="h-3 w-3 text-green-400" />}
                                  {insight.type === 'opportunity' && <Target className="h-3 w-3 text-blue-400" />}
                                  {insight.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
                                  {insight.type === 'risk' && <AlertCircle className="h-3 w-3 text-red-400" />}
                                  {insight.type === 'recommendation' && <Target className="h-3 w-3 text-blue-400" />}
                                </div>
                                
                                <div className="flex-1">
                                  {/* Title */}
                                  <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                                  
                                  {/* Brief Description */}
                                  <CardDescription className="text-sm leading-relaxed">
                                    {(() => {
                                      const fullText = insight.insight || '';
                                      const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
                                      const briefText = sentences.slice(0, 2).join('. ');
                                      return briefText.length > 0 ? briefText + '.' : 'Click to view detailed analysis.';
                                    })()}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(insight.confidence * 100)}%
                                </Badge>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4 pl-7">
                            {/* Detailed Analysis */}
                            {insight.insight && (
                              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Detailed Analysis
                                </h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                  {insight.insight}
                                </p>
                              </div>
                            )}

                            {/* Recommended Actions */}
                            {insight.actionable_steps && insight.actionable_steps.length > 0 && (
                              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  Recommended Actions
                                </h4>
                                <div className="space-y-3">
                                  {insight.actionable_steps.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-medium text-purple-300">{idx + 1}</span>
                                      </div>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                        {parseMarkdownBold(action.trim())}{action.trim() && !action.trim().endsWith('.') ? '.' : ''}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  return null
}
