import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from 'app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Target, 
  Zap, 
  CheckCircle, 
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${highlight ? 'border-primary bg-primary/5' : ''}`}>
      <CardHeader className="pb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${highlight ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardContent>
      {highlight && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      )}
    </Card>
  );
}

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  rating: number;
}

function Testimonial({ name, role, content, rating }: TestimonialProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <CardDescription className="text-sm italic leading-relaxed">
          "{content}"
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </CardContent>
    </Card>
  );
}

export function FreemiumLandingPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribeNow = async () => {
    setIsLoading(true);
    try {
      // Redirect to Settings page where users can subscribe
      navigate('/settings');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Trading Coach",
      description: "Get personalized insights and recommendations from our advanced AI that analyzes your trading patterns and suggests improvements.",
      highlight: true
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Comprehensive performance metrics, risk analysis, and detailed reports to understand your trading behavior and profitability."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Trading Journal",
      description: "Automated trade journaling with emotional tracking, strategy notes, and performance correlation analysis."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Platform Sync",
      description: "Automatic trade import from MT4/MT5, cTrader, and Tradovate. No manual entry required - focus on trading, not data entry."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk Management Suite",
      description: "Advanced risk analytics, drawdown analysis, position sizing recommendations, and risk alerts to protect your capital."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Multi-Account Tracking",
      description: "Track performance across multiple live accounts and evaluations with unified analytics and comparison tools."
    }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Professional Trader",
      content: "TradingBait's AI insights helped me identify patterns I never noticed. My win rate improved by 15% in just 2 months.",
      rating: 5
    },
    {
      name: "Sarah Williams",
      role: "Prop Trader",
      content: "The automated journaling saves me hours every week. The emotional tracking feature is a game-changer for my psychology.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Forex Trader",
      content: "Finally, a platform that understands trading psychology. The risk management tools helped me reduce my max drawdown significantly.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TradingBait</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.displayName || user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/logout')}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 px-6">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Professional Trading Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Transform Your Trading with
            <span className="text-primary block mt-2">AI-Powered Analytics</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Stop guessing. Start knowing. TradingBait analyzes your trading patterns, 
            identifies improvement opportunities, and helps you become a consistently profitable trader.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleSubscribeNow}
              disabled={isLoading}
              className="text-lg px-8 py-6"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  Start Trading Smarter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Setup takes less than 5 minutes</span>
            </div>
          </div>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2">4.9/5 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Trade Better
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform combines advanced analytics, AI insights, and intuitive design 
            to help you make better trading decisions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Professional Trading Analytics Platform - Transform Your Trading Today
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="relative overflow-hidden border-primary shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
            <CardHeader className="text-center pb-6">
              <Badge className="mx-auto mb-4 bg-primary/10 text-primary border-primary/20">
                TradingBait Pro
              </Badge>
              <CardTitle className="text-2xl mb-2">Professional Plan</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">
                $24.99
                <span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <CardDescription>
                Complete Trading Analytics Suite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  "Unlimited trade analysis",
                  "AI-powered insights & coaching",
                  "Advanced performance analytics",
                  "Automated trading journal",
                  "Real-time platform integrations",
                  "Risk management tools",
                  "Multi-account tracking",
                  "Priority email support",
                  "Mobile-responsive dashboard",
                  "Data export & reporting"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <Button 
                className="w-full text-lg py-6" 
                onClick={handleSubscribeNow}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Subscribe Now - $24.99/month'}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime. No long-term commitments.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20 px-6 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Professional Traders
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our professional traders are saying about TradingBait.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of professional traders who trust TradingBait to improve their performance. 
            Start your journey to consistent profitability today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              onClick={handleSubscribeNow}
              disabled={isLoading}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? 'Processing...' : 'Start Your $24.99/Month Subscription'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              onClick={() => navigate('/help')}
              className="text-lg px-8 py-6"
            >
              View Pricing Details
            </Button>
            <Button 
              variant="ghost"
              size="lg" 
              onClick={() => window.open('mailto:support@tradingbait.com', '_blank')}
              className="text-lg px-8 py-6"
            >
              Contact Sales
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Questions? Contact our support team anytime.
          </p>
          
          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95">
        <div className="container py-8 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">TradingBait</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/privacy-policy')} className="hover:text-foreground transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms-of-service')} className="hover:text-foreground transition-colors">
                Terms of Service
              </button>
              <span>© 2024 TradingBait. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
