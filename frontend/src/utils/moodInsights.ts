// Comprehensive mood insights for trading psychology
// Provides personalized guidance for each emotional state

export interface MoodInsight {
  title: string;
  message: string;
  category: 'positive' | 'neutral' | 'challenging';
  actionableAdvice: string[];
  riskLevel: 'low' | 'medium' | 'high';
  tradingTips: string[];
}

// Comprehensive mood insights mapping
export const MOOD_INSIGHTS: Record<string, MoodInsight> = {
  // POSITIVE MOODS
  'confident': {
    title: 'Confidence is your strength!',
    message: 'You\'re feeling strong and decisive today. This is excellent for executing your trading plan with conviction.',
    category: 'positive',
    actionableAdvice: [
      'Channel confidence into thorough analysis rather than larger position sizes',
      'Stick to your predetermined risk management rules',
      'Use this energy to review and refine your trading strategies'
    ],
    riskLevel: 'medium',
    tradingTips: [
      'Avoid overconfidence bias - maintain your usual position sizing',
      'Double-check your analysis before entering trades',
      'Set stop losses before placing trades, not after'
    ]
  },
  
  'disciplined': {
    title: 'Discipline is your superpower!',
    message: 'You\'re in the perfect mindset for systematic trading. This self-control will serve you well today.',
    category: 'positive',
    actionableAdvice: [
      'Follow your trading plan exactly as written',
      'Use this discipline to wait for high-probability setups',
      'Document your trades meticulously for future analysis'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Perfect day to practice patience with entries and exits',
      'Stick to your predetermined criteria for trade selection',
      'Consider reviewing your journal for pattern insights'
    ]
  },
  
  'focused': {
    title: 'Crystal clear focus!',
    message: 'Your mind is sharp and concentrated. This mental clarity is ideal for complex market analysis.',
    category: 'positive',
    actionableAdvice: [
      'Use this focus for deep market analysis and chart reading',
      'Perfect time to work on your most challenging trading strategies',
      'Consider doing additional research on your watchlist'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Ideal conditions for technical analysis and pattern recognition',
      'Great day to practice your entry and exit timing',
      'Use this clarity to update your trading plan if needed'
    ]
  },
  
  'satisfied': {
    title: 'Contentment brings balance!',
    message: 'You\'re feeling satisfied and content. This balanced emotional state reduces the pressure to force trades.',
    category: 'positive',
    actionableAdvice: [
      'Maintain this balanced perspective throughout the trading session',
      'Use contentment to avoid FOMO and revenge trading',
      'Focus on quality over quantity in your trade selection'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Perfect mindset for patient, selective trading',
      'Less likely to overtrade when feeling satisfied',
      'Good day to work on your long-term trading goals'
    ]
  },
  
  'in_zone': {
    title: 'You\'re in the zone!',
    message: 'Peak performance state detected! You\'re likely to make clear, intuitive decisions today.',
    category: 'positive',
    actionableAdvice: [
      'Trust your analysis but verify with your checklist',
      'Perfect time to trade your A+ setups',
      'Stay hydrated and take breaks to maintain this flow state'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Excellent conditions for complex trading strategies',
      'Your pattern recognition should be at its peak',
      'Document what led to this state for future reference'
    ]
  },
  
  'patient': {
    title: 'Patience is profitable!',
    message: 'Your patience today will likely translate to better trade selection and improved results.',
    category: 'positive',
    actionableAdvice: [
      'Use this patience to wait for perfect setups',
      'Avoid forcing trades just to be "active"',
      'Perfect mindset for swing trading and longer timeframes'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Great day to practice waiting for optimal entries',
      'Consider focusing on higher timeframe analysis',
      'Use patience to let winners run longer'
    ]
  },
  
  // NEUTRAL MOODS
  'neutral': {
    title: 'Balanced and objective!',
    message: 'Neutral emotions are often ideal for trading. You can make decisions without emotional interference.',
    category: 'neutral',
    actionableAdvice: [
      'Maintain this objectivity throughout your trading session',
      'Perfect state for mechanical execution of your trading plan',
      'Use this clarity to review recent trades objectively'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Ideal conditions for following your trading system precisely',
      'Great time to practice risk management techniques',
      'Consider this your "default" trading state to cultivate'
    ]
  },
  
  'cautious': {
    title: 'Caution can be wisdom!',
    message: 'Your cautious approach today may help you avoid unnecessary risks and focus on high-probability trades.',
    category: 'neutral',
    actionableAdvice: [
      'Use caution to thoroughly analyze trades before entering',
      'Consider smaller position sizes if uncertainty persists',
      'Perfect mindset for defensive trading strategies'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Excellent day for risk management practice',
      'Focus on preservation of capital over aggressive gains',
      'Consider paper trading if feeling overly cautious'
    ]
  },
  
  'analytical': {
    title: 'Data-driven approach!',
    message: 'Your analytical mindset is perfect for systematic trading. Let the data guide your decisions.',
    category: 'neutral',
    actionableAdvice: [
      'Focus on technical indicators and statistical analysis',
      'Perfect time to backtest strategies or review performance data',
      'Use this mindset to improve your trading systems'
    ],
    riskLevel: 'low',
    tradingTips: [
      'Great conditions for strategy development and testing',
      'Focus on probability-based decision making',
      'Consider doing deeper market research today'
    ]
  },
  
  // CHALLENGING MOODS
  'frustrated': {
    title: 'Frustration needs management!',
    message: 'Frustration can cloud judgment and lead to revenge trading. Take steps to reset your mindset.',
    category: 'challenging',
    actionableAdvice: [
      'Take a break before making any trading decisions',
      'Consider reducing position sizes by 50% today',
      'Focus on your breathing and stress management habits'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Avoid revenge trading at all costs',
      'Consider ending the session early if frustration persists',
      'Review what caused the frustration to prevent recurrence'
    ]
  },
  
  'anxious': {
    title: 'Anxiety affects decisions!',
    message: 'Anxiety can lead to hesitation in good setups or impulsive decisions in poor ones.',
    category: 'challenging',
    actionableAdvice: [
      'Practice deep breathing exercises before trading',
      'Consider meditation or mindfulness techniques',
      'Start with smaller position sizes to build confidence'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Stick to your most familiar and tested strategies',
      'Avoid trying new techniques when anxious',
      'Consider demo trading to rebuild confidence'
    ]
  },
  
  'regretful': {
    title: 'Learn from regret!',
    message: 'Regret about past decisions can impact future judgment. Focus on the present and lessons learned.',
    category: 'challenging',
    actionableAdvice: [
      'Write down lessons learned from past trades',
      'Focus on the present moment and current opportunities',
      'Consider talking to a trading mentor or journal about feelings'
    ],
    riskLevel: 'medium',
    tradingTips: [
      'Avoid trying to "make up" for past losses',
      'Stick to your normal position sizing',
      'Remember that regret is part of the learning process'
    ]
  },
  
  'overwhelmed': {
    title: 'Simplify when overwhelmed!',
    message: 'Too much information or complexity can paralyze decision-making. Strip back to basics.',
    category: 'challenging',
    actionableAdvice: [
      'Focus on only 1-2 instruments instead of your full watchlist',
      'Use simpler strategies and fewer indicators',
      'Take regular breaks every 30-45 minutes'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Reduce the number of charts and indicators you monitor',
      'Focus on your highest-probability setups only',
      'Consider shorter trading sessions today'
    ]
  },
  
  'fomo': {
    title: 'FOMO can be expensive!',
    message: 'Fear of missing out often leads to chasing trades and poor entries. Step back and breathe.',
    category: 'challenging',
    actionableAdvice: [
      'Remind yourself that there\'s always another opportunity',
      'Set strict entry criteria and stick to them',
      'Take a 10-minute break when feeling FOMO'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Never chase a trade that\'s already moved significantly',
      'Wait for pullbacks to your predetermined entry levels',
      'Focus on patience rather than action'
    ]
  },
  
  'revenge_trading': {
    title: 'Stop revenge trading!',
    message: 'Trading to recover losses quickly is one of the fastest ways to increase losses. Reset immediately.',
    category: 'challenging',
    actionableAdvice: [
      'Stop trading immediately and step away from charts',
      'Review your trading plan and risk management rules',
      'Consider talking to a mentor or trading community'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Do not trade for the rest of the session',
      'Focus on demo trading until emotions stabilize',
      'Remember: the market will be there tomorrow'
    ]
  },
  
  'impatient': {
    title: 'Patience pays in trading!',
    message: 'Impatience often leads to premature entries and exits. Slow down and stick to your plan.',
    category: 'challenging',
    actionableAdvice: [
      'Set timers to remind yourself to wait for proper setups',
      'Review why patience is crucial in your trading strategy',
      'Consider switching to longer timeframes temporarily'
    ],
    riskLevel: 'medium',
    tradingTips: [
      'Avoid scalping or short-term strategies today',
      'Focus on swing trades or longer-term positions',
      'Use alerts instead of watching charts constantly'
    ]
  },
  
  // ADDITIONAL MOODS FROM ORIGINAL SYSTEM
  'excited': {
    title: 'Channel excitement wisely!',
    message: 'High excitement can lead to great energy but also to overtrading. Keep your enthusiasm focused.',
    category: 'positive',
    actionableAdvice: [
      'Use this energy for market research and preparation',
      'Maintain normal position sizing despite feeling energetic',
      'Channel excitement into thorough analysis'
    ],
    riskLevel: 'medium',
    tradingTips: [
      'Avoid increasing trade frequency just because you\'re excited',
      'Stick to your planned trading approach',
      'Great time to work on your trading education'
    ]
  },
  
  'tired': {
    title: 'Fatigue impairs judgment!',
    message: 'Mental fatigue significantly reduces trading performance. Consider if today is a good trading day.',
    category: 'challenging',
    actionableAdvice: [
      'Consider not trading if severely fatigued',
      'If you must trade, reduce position sizes significantly',
      'Take frequent breaks and stay hydrated'
    ],
    riskLevel: 'high',
    tradingTips: [
      'Stick to your most mechanical, systematic strategies',
      'Avoid complex analysis or new techniques',
      'Consider demo trading or market observation only'
    ]
  }
};

// Helper function to get mood insight by mood name or id
export function getMoodInsight(mood: string): MoodInsight | null {
  // Handle both mood name and mood id
  const normalizedMood = mood.toLowerCase().replace(/\s+/g, '_');
  
  // Try exact match first
  if (MOOD_INSIGHTS[mood]) {
    return MOOD_INSIGHTS[mood];
  }
  
  // Try normalized match
  if (MOOD_INSIGHTS[normalizedMood]) {
    return MOOD_INSIGHTS[normalizedMood];
  }
  
  // Try partial match for custom moods
  const moodKeys = Object.keys(MOOD_INSIGHTS);
  const partialMatch = moodKeys.find(key => 
    key.includes(normalizedMood) || normalizedMood.includes(key)
  );
  
  if (partialMatch) {
    return MOOD_INSIGHTS[partialMatch];
  }
  
  return null;
}

// Helper function to get mood category color
export function getMoodCategoryColor(category: string): string {
  switch (category) {
    case 'positive':
      return 'text-green-400 border-green-500/20 bg-green-500/10';
    case 'neutral':
      return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    case 'challenging':
      return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    default:
      return 'text-gray-400 border-gray-500/20 bg-gray-500/10';
  }
}

// Helper function to get risk level color
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'high':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

// Helper function to get risk level icon
export function getRiskLevelIcon(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🔴';
    default:
      return '⚪';
  }
}
