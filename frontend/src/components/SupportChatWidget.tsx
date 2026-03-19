import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Search, HelpCircle, ArrowLeft, ThumbsUp, ThumbsDown, Rocket, Settings, Wrench, BarChart3, DollarSign, TrendingUp, Shield, BookOpen, Mail, Send, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from "app";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import brain from 'utils/brain';

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface SupportQuestion {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[];
  helpful_count: number;
  view_count: number;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  content?: JSX.Element; // Add optional JSX content field
}

interface QuickOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  category?: string;
}

interface Props {}

const quickOptions: QuickOption[] = [
  {
    id: 'email-support',
    label: 'Email Support',
    icon: Mail,
    description: 'Send a message directly to our support team',
    category: 'support'
  },
  {
    id: 'how-to-start',
    label: 'How to Start',
    icon: Rocket,
    description: 'Get started with TradingBait and set up your account',
    category: 'getting-started'
  },
  {
    id: 'import-trades',
    label: 'How to Import Trades',
    icon: Settings,
    description: 'Upload CSV or HTML files from your broker',
    category: 'setup'
  },
  {
    id: 'understand-analytics',
    label: 'Understand Analytics',
    icon: BarChart3,
    description: 'Learn about performance metrics and trading insights',
    category: 'analytics'
  },
  {
    id: 'understand-risks',
    label: 'Understand Risks',
    icon: Shield,
    description: 'Risk management and trading safety guidelines',
    category: 'risk-management'
  },
  {
    id: 'how-to-journal',
    label: 'How to Journal',
    icon: BookOpen,
    description: 'Best practices for maintaining your trading journal',
    category: 'journaling'
  },
  {
    id: 'track-journey',
    label: 'How to Track Your Trading Journey',
    icon: TrendingUp,
    description: 'Use the MyFundingJourney page to monitor progress',
    category: 'tracking'
  },
  {
    id: 'subscriptions',
    label: 'Subscription Information',
    icon: DollarSign,
    description: 'Billing, plans, and subscription management',
    category: 'billing'
  }
];

// Predefined responses for each category
const responses: Record<string, any> = {
  'how-to-start': {
    title: "Welcome to TradingBait!",
    content: [
      {
        heading: "Getting Started Steps:",
        items: [
          "**Create your account** - Sign up with your email",
          "**Import your trading data** - Upload CSV or HTML files from your broker", 
          "**Set up your profile** - Complete your trading experience and goals",
          "**Explore the dashboard** - Check out Analytics, Performance, and AI Coach"
        ]
      }
    ],
    footer: "Need help importing your data? Let us know!"
  },
  
  'import-trades': {
    title: "How to Import Your Trades",
    content: [
      {
        heading: "CSV Import (Recommended):",
        items: [
          "Export trades from your broker as CSV",
          "Go to Import Trades in the dashboard",
          "Upload your CSV file with trade history",
          "Review and confirm your imported trades"
        ]
      },
      {
        heading: "HTML Reports:",
        items: [
          "Download HTML trade reports from your platform",
          "Use the HTML import option in our dashboard",
          "We'll extract your trade data automatically"
        ]
      },
      {
        heading: "Supported Platforms:",
        items: [
          "MetaTrader 4/5 (CSV export)",
          "cTrader (HTML reports)",
          "Most major brokers (CSV format)"
        ]
      }
    ],
    footer: "Having trouble with your file format? Contact support!"
  },
  
  'understand-analytics': {
    title: "Understanding Your Analytics",
    content: [
      {
        heading: "Performance Overview:",
        items: [
          "**Win Rate** - Percentage of profitable trades",
          "**Average Win/Loss** - Your typical profit vs loss amounts",
          "**Risk/Reward Ratio** - How much you risk vs potential profit"
        ]
      },
      {
        heading: "Charts & Insights:",
        items: [
          "P&L over time",
          "Trading frequency patterns",
          "Currency pair performance"
        ]
      }
    ],
    footer: "Use these metrics to identify strengths and areas for improvement!"
  },
  
  'understand-risks': {
    title: "Understanding and Managing Risk",
    content: [
      {
        heading: "Key Risk Metrics:",
        items: [
          "**Max Drawdown** - Largest losing streak",
          "**Risk per Trade** - How much you risk per position",
          "**Account Risk** - Total portfolio exposure"
        ]
      },
      {
        heading: "Best Practices:",
        items: [
          "Never risk more than 1-2% per trade",
          "Set stop losses on every trade",
          "Diversify across different currency pairs",
          "Review your Risk Management page regularly"
        ]
      }
    ],
    footer: "Remember: Protect your capital first, profits second!"
  },
  
  'how-to-journal': {
    title: "Effective Trading Journaling",
    content: [
      {
        heading: "What to Track:",
        items: [
          "Entry/exit reasons",
          "Market conditions",
          "Emotional state",
          "Trade setup quality",
          "Lessons learned"
        ]
      },
      {
        heading: "Using TradingBait:",
        items: [
          "Add notes to individual trades",
          "Use tags to categorize setups",
          "Review weekly/monthly performance",
          "Track your trading psychology"
        ]
      }
    ],
    footer: "Consistent journaling leads to better decision-making!"
  },
  
  'track-journey': {
    title: "Track Your Trading Journey",
    content: [
      {
        heading: "MyFundingJourney Features:",
        items: [
          "**Funding Timeline** - Track your progress toward funding goals",
          "**Challenge Progress** - Monitor evaluation requirements",
          "**Performance Milestones** - Celebrate achievements",
          "**Goal Setting** - Set and track trading objectives"
        ]
      },
      {
        heading: "Pro Tips:",
        items: [
          "Update your goals regularly",
          "Track both performance and psychological progress",
          "Use milestones to stay motivated"
        ]
      }
    ],
    footer: "Navigate to MyFundingJourney from the main menu to get started!"
  },
  
  'subscriptions': {
    title: "Subscription Information",
    content: [
      {
        heading: "TradingBait Plan ($7.99/month):",
        items: [
          "$7.99/month, billed monthly",
          "Cancel anytime from Settings",
          "No free trial — you're charged immediately",
          "Includes all features: journal, analytics, AI coaching, routines"
        ]
      }
    ],
    footer: "Questions about billing? Contact support!"
  },
  
  'email-support': {
    title: "Contact Support",
    isEmailForm: true,
    content: "We're here to help! Send us a message and we'll get back to you as soon as possible."
  }
};

// Helper function to format JSON response as readable JSX
const formatResponse = (responseData: any): JSX.Element => {
  const renderText = (text: string) => {
    // Split text by **bold** markers and render accordingly
    const parts = text.split(/\*\*(.*?)\*\*/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is the content between ** markers - make it bold
        return <strong key={index} className="font-semibold text-blue-400">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-blue-400">{responseData.title}</h3>
      
      {responseData.content.map((section: any, sectionIndex: number) => (
        <div key={sectionIndex} className="space-y-2">
          <h4 className="font-semibold text-gray-300">{section.heading}</h4>
          <ul className="space-y-1 ml-4">
            {section.items.map((item: string, itemIndex: number) => (
              <li key={itemIndex} className="flex items-start text-gray-300">
                <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
                <span>{renderText(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      {responseData.footer && (
        <p className="text-gray-400 italic mt-4">{renderText(responseData.footer)}</p>
      )}
    </div>
  );
};

export function SupportChatWidget({}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'welcome' | 'chat' | 'email'>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailForm, setEmailForm] = useState({
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useCurrentUser();

  // Auto-fill email when user is signed in
  useEffect(() => {
    if (user?.email) {
      setEmailForm(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const trackAnalytics = async (eventType: string, metadata: any) => {
    try {
      if (user?.uid) {
        await brain.track_user_event({
          user_id: user.uid,
          event_type: eventType,
          session_id: `support_${sessionStartTime}`,
          timestamp: new Date().toISOString(),
          metadata
        });
      }
    } catch (e) {
      console.debug('Analytics tracking failed:', e);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission from refreshing the page
    
    if (!emailForm.email || !emailForm.subject || !emailForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingEmail(true);
    
    try {
      const userName = user?.displayName || emailForm.email;
      
      await brain.send_support_email({
        user_email: emailForm.email,
        subject: emailForm.subject,
        message: emailForm.message,
        priority: emailForm.priority,
        user_name: userName,
        user_id: user?.uid || undefined
      });
      
      toast.success('Your message has been sent! We\'ll get back to you soon.');
      setEmailForm({ email: user?.email || '', subject: '', message: '', priority: 'medium' });
      setCurrentView('welcome');
      
      // Track email submission
      await trackAnalytics('support_email_sent', {
        subject: emailForm.subject,
        priority: emailForm.priority,
        message_length: emailForm.message.length,
        user_type: user ? 'signed_in' : 'anonymous'
      });
      
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send message. Please try again or email support@tradingbait.com directly.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleQuickOption = async (option: QuickOption) => {
    // Handle email support differently
    if (option.id === 'email-support') {
      setCurrentView('email');
      await trackAnalytics('support_email_form_opened', {
        option_selected: option.id
      });
      return;
    }
    
    // Add user message for the selected option
    const userMessage: Message = {
      id: Date.now(),
      text: option.label,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentView('chat');
    setIsLoading(true);
    
    // Show the predefined response for this category
    setTimeout(() => {
      const response = responses[option.id];
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: '', // We'll use content instead
        isUser: false,
        timestamp: new Date(),
        content: response ? formatResponse(response) : (
          <div className="text-gray-300">
            <p>I'd be happy to help with that! Could you provide more details about what you're looking for?</p>
          </div>
        )
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      
      // Track successful response
      trackAnalytics('support_response_shown', {
        option_selected: option.id,
        response_type: response ? 'predefined' : 'fallback'
      });
    }, 1000);
  };

  const resetToWelcome = () => {
    setCurrentView('welcome');
    setMessages([]);
  };

  const handleWidgetToggle = async (opening: boolean) => {
    setIsOpen(opening);
    
    await trackAnalytics(opening ? 'support_widget_opened' : 'support_widget_closed', {
      current_view: currentView,
      session_duration: opening ? 0 : Date.now() - sessionStartTime
    });
    
    if (opening) {
      setSessionStartTime(Date.now());
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => handleWidgetToggle(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 border-0"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-80 h-[600px] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">TradingBait Support</h3>
              <p className="text-xs text-blue-100">We're here to help</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleWidgetToggle(false)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {currentView === 'welcome' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-shrink-0 text-center p-4 pb-3">
                <h4 className="text-lg font-semibold text-white mb-1">What would you like to know?</h4>
                <p className="text-xs text-gray-400">Choose a topic or ask us anything</p>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-2 pb-4">
                  {quickOptions.map((option) => {
                    const IconComponent = option.icon;
                    const isEmailSupport = option.id === 'email-support';
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleQuickOption(option)}
                        className={`w-full p-2.5 rounded-lg border transition-all duration-200 text-left group ${
                          isEmailSupport 
                            ? 'border-blue-500/70 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400'
                            : 'border-gray-600/50 bg-gray-800/30 hover:bg-gray-700/50 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                            isEmailSupport
                              ? 'bg-gradient-to-r from-blue-500/40 to-purple-500/40 group-hover:from-blue-500/50 group-hover:to-purple-500/50'
                              : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30'
                          }`}>
                            <IconComponent className={`h-3.5 w-3.5 ${
                              isEmailSupport ? 'text-blue-300' : 'text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium text-xs transition-colors ${
                              isEmailSupport 
                                ? 'text-blue-200 group-hover:text-blue-100'
                                : 'text-white group-hover:text-blue-300'
                            }`}>
                              {option.label}
                            </div>
                            <div className={`text-xs mt-0.5 leading-tight ${
                              isEmailSupport ? 'text-blue-300/80' : 'text-gray-400'
                            }`}>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-shrink-0 p-4 pt-2">
                <button
                  onClick={resetToWelcome}
                  className="w-full p-2.5 rounded-lg border border-gray-600/50 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-200 text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-300">Go Back to the Start</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {currentView === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-800/50 text-gray-200 border border-gray-700/50'
                      }`}
                    >
                      {message.content || (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 text-gray-200 border border-gray-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Back Button */}
              <div className="flex-shrink-0 p-4 pt-2">
                <button
                  onClick={resetToWelcome}
                  className="w-full p-2.5 rounded-lg border border-gray-600/50 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-200 text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-300">Back to Options</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {currentView === 'email' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-shrink-0 p-4 pb-3">
                <h4 className="text-lg font-semibold text-white mb-1">Contact Support</h4>
                <p className="text-xs text-gray-400">Send us a message and we'll get back to you soon</p>
              </div>
              
              <form onSubmit={handleEmailSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-4 space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300 mb-2 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                      disabled={!!user?.email}
                      required
                    />
                    {user?.email && (
                      <p className="text-xs text-gray-400 mt-1">Using your account email</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-300 mb-2 block">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="What can we help you with?"
                      className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-gray-300 mb-2 block">
                      Priority
                    </Label>
                    <select
                      id="priority"
                      value={emailForm.priority}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2 bg-gray-800/50 border border-gray-600/50 rounded-md text-white focus:border-blue-500/50 focus:outline-none"
                    >
                      <option value="low">Low - General question</option>
                      <option value="medium">Medium - Need help</option>
                      <option value="high">High - Urgent issue</option>
                    </select>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label htmlFor="message" className="text-sm font-medium text-gray-300 mb-2 block">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please describe your question or issue in detail..."
                      className="flex-1 min-h-[120px] bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 resize-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex-shrink-0 p-4 space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmittingEmail || !emailForm.email.trim() || !emailForm.subject.trim() || !emailForm.message.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isSubmittingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={resetToWelcome}
                    className="w-full p-2.5 rounded-lg border border-gray-600/50 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-200 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-300">Back to Options</span>
                    </div>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
