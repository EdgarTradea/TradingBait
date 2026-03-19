import { Header } from "components/Header";
import { Sidebar } from "components/Sidebar";
import { DashboardManager } from "components/DashboardManager";
import { useTheme } from "@/hooks/use-theme";
import { useStore } from "utils/store";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { APP_BASE_PATH, useUserGuardContext } from "app";
import brain from "brain";
import { toast } from "sonner";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { ContactSupportForm } from "components/ContactSupportForm";
import { 
  UserBillingInfo, 
  UsageInfo, 
  CustomerPortalResponse 
} from 'types';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Progress 
} from '@/components/ui/progress';
import { 
  Separator 
} from '@/components/ui/separator';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Download,
  ExternalLink,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Gift,
  Crown
} from 'lucide-react';
import { CheckoutModal } from "components/CheckoutModal";
import { TrialStatusBanner } from "components/TrialStatusBanner";

export default function Settings() {
  const { setTheme } = useTheme();
  const { isSidebarCollapsed } = useStore();
  const { user } = useUserGuardContext();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(true);
  
  // Billing state
  const [billingInfo, setBillingInfo] = useState<UserBillingInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Trial state
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [trialLoading, setTrialLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Effect for MetaTrader webhook URL
  useEffect(() => {
    const fetchWebhookSecret = async () => {
      try {
        setIsLoadingWebhook(true);
        const response = await brain.get_or_create_metatrader_secret();
        const data = await response.json();
        
        // Construct the full URL
        const secretKey = data.secret_key;
        // Use correct base URL based on environment
        const baseUrl = window.location.hostname.endsWith('riff.new')
          ? "https://riff.new/_projects/47e89438-adfe-4372-b617-66a3eabfadfe/dbtn/devx/app/routes"
          : "https://www.tradingbait.com/api";
        const fullUrl = `${baseUrl}/metatrader-webhook/${secretKey}`;
        setWebhookUrl(fullUrl);

      } catch (error) {
        console.error("Failed to fetch MetaTrader webhook URL:", error);
        toast.error("Could not retrieve your MetaTrader webhook URL.");
      } finally {
        setIsLoadingWebhook(false);
      }
    };
    fetchWebhookSecret();
  }, []);
  
  // Effect for billing data
  useEffect(() => {
    fetchBillingData();
  }, []);

  // Effect for trial status
  useEffect(() => {
    fetchTrialStatus();
  }, []);
  
  const fetchTrialStatus = async () => {
    try {
      setTrialLoading(true);
      const response = await brain.get_trial_status();
      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setTrialLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  // Billing functions
  const fetchBillingData = async () => {
    try {
      setBillingLoading(true);
      const [billingResponse, usageResponse] = await Promise.all([
        brain.get_user_billing_info(),
        brain.get_usage_info()
      ]);
      
      const billingData = await billingResponse.json();
      const usageData = await usageResponse.json();
      
      setBillingInfo(billingData);
      setUsageInfo(usageData);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    try {
      setActionLoading(true);
      const response = await brain.get_customer_portal_url();
      const data: CustomerPortalResponse = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // Open checkout modal instead of direct checkout
    setIsCheckoutModalOpen(true);
  };

  const handleCancelTrial = async () => {
    try {
      setActionLoading(true);
      await brain.cancel_trial();
      toast.success('Trial cancelled successfully');
      fetchTrialStatus();
    } catch (error) {
      console.error('Error cancelling trial:', error);
      toast.error('Failed to cancel trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      await brain.reactivate_subscription();
      toast.success('Subscription has been reactivated');
      fetchBillingData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Active' },
      canceled: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Cancelled' },
      past_due: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Past Due' },
      trialing: { variant: 'secondary' as const, icon: Clock, text: 'Trial' },
      incomplete: { variant: 'secondary' as const, icon: Clock, text: 'Incomplete' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: 'secondary' as const, icon: Clock, text: status };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };
  
  return (
    <div
      className={`flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-foreground ${
        isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
      }`}
    >
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8 pb-20 sm:pb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent">Settings</h1>
          <p className="text-gray-400">
            Manage your account and application settings here.
          </p>
          <div className="mt-6 space-y-6 sm:space-y-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="font-bold text-gray-100">Appearance</CardTitle>
                <CardDescription className="text-gray-400">
                  Select the theme for the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="theme"
                      className="text-sm font-medium"
                    >
                      Theme
                    </label>
                    <Select onValueChange={setTheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="font-bold text-gray-100">Data Import</CardTitle>
                <CardDescription className="text-gray-400">
                  Import your trading data from CSV or HTML files exported from your broker.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  
                  {/* CSV Import Section */}
                  <AccordionItem value="item-1">
                    <AccordionTrigger>CSV File Import (Recommended)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="p-4 bg-muted/50 rounded-lg mt-2 space-y-2">
                          <h4 className="font-medium text-sm">How to Export from Your Broker:</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                            <li><strong>MetaTrader 4/5:</strong> Go to Account History → Right-click → Save as Report → Choose Detailed Statement (CSV)</li>
                            <li><strong>cTrader:</strong> Go to History → Export → Select CSV format</li>
                            <li><strong>Most Brokers:</strong> Look for "Trade History", "Account Statement", or "Export" in your platform</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="font-medium text-sm text-blue-300 mb-2">CSV Format Requirements:</h4>
                          <p className="text-xs text-muted-foreground mb-2">Your CSV should include these columns:</p>
                          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                            <li>Trade open/close dates and times</li>
                            <li>Symbol/Currency pair</li>
                            <li>Buy/Sell direction</li>
                            <li>Volume/Lot size</li>
                            <li>Open and close prices</li>
                            <li>Profit/Loss amounts</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  {/* HTML Import Section */}
                  <AccordionItem value="item-2">
                    <AccordionTrigger>HTML Report Import</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="p-4 bg-muted/50 rounded-lg mt-2 space-y-2">
                          <h4 className="font-medium text-sm">Supported HTML Reports:</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                            <li><strong>cTrader:</strong> Export detailed HTML trading reports</li>
                            <li><strong>MetaTrader:</strong> Generate and save HTML account statements</li>
                            <li><strong>Other Platforms:</strong> Most detailed HTML reports work</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <h4 className="font-medium text-sm text-green-300 mb-2">Benefits of HTML Import:</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                            <li>Automatic data extraction and parsing</li>
                            <li>Preserves detailed trade information</li>
                            <li>Works with complex report formats</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  {/* cTrader Section - Temporarily Hidden */}
                  {/* 
                  <AccordionItem value="item-ctrader">
                    <AccordionTrigger>cTrader</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <CTraderIntegration />
                    </AccordionContent>
                  </AccordionItem>
                  */}
                  
                  {/* Coming Soon Section */}
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-muted-foreground">
                      Coming Soon Integrations
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-blue-500/20 rounded">
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-500 mb-1">Need Another Platform?</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              We're constantly adding new integrations based on user demand. In the meantime, 
                              you can easily import your trades manually or via CSV upload.
                            </p>
                            <ContactSupportForm 
                              variant="link" 
                              size="sm"
                              className="p-0 h-auto text-blue-500 hover:text-blue-400"
                            >
                              Request a new integration →
                            </ContactSupportForm>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Public Dashboards Section */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Public Dashboards</CardTitle>
                <CardDescription className="text-gray-400">
                  Create and manage shareable dashboards to showcase your trading performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardManager />
              </CardContent>
            </Card>
            
            {/* Trial Status Section */}
            {trialStatus?.is_trial_active && (
              <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/50">
                <CardHeader>
                  <CardTitle className="text-emerald-300 flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Free Trial Status
                  </CardTitle>
                  <CardDescription className="text-emerald-200/80">
                    Manage your 7-day free trial and upgrade options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    
                    {/* Trial Overview */}
                    <AccordionItem value="trial-overview">
                      <AccordionTrigger className="text-emerald-300">Trial Overview</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-4">
                        {trialLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-emerald-300/20 rounded w-1/4"></div>
                            <div className="h-20 bg-emerald-300/20 rounded"></div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-emerald-400" />
                                  <h4 className="font-semibold text-emerald-300">Trial Period</h4>
                                </div>
                                {trialStatus.has_cancelled && (
                                  <Badge variant="outline" className="text-orange-300 border-orange-400">
                                    Cancelled
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-emerald-300">Days Remaining</p>
                                  <p className="text-2xl font-bold text-emerald-200">
                                    {trialStatus.days_remaining || 0}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-emerald-300">Trial Plan</p>
                                  <p className="text-lg font-semibold text-emerald-200">
                                    {trialStatus.trial_plan || 'Basic'}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-emerald-300">End Date</p>
                                  <p className="text-lg font-semibold text-emerald-200">
                                    {trialStatus.trial_end_date 
                                      ? new Date(trialStatus.trial_end_date).toLocaleDateString()
                                      : 'N/A'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Usage Limits */}
                    <AccordionItem value="usage-limits">
                      <AccordionTrigger className="text-emerald-300">Usage & Limits</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-4">
                        <div className="space-y-4">
                          {/* Trades Usage */}
                          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-emerald-300">Trades</span>
                              <span className="text-emerald-200">
                                {trialStatus?.current_usage?.trades_used || 0}/{trialStatus?.usage_limits?.trades || 50}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(((trialStatus?.current_usage?.trades_used || 0) / (trialStatus?.usage_limits?.trades || 50)) * 100, 100)} 
                              className="h-2" 
                            />
                          </div>
                          
                          {/* Evaluations Usage */}
                          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-emerald-300">Evaluations</span>
                              <span className="text-emerald-200">
                                {trialStatus?.current_usage?.evaluations_used || 0}/{trialStatus?.usage_limits?.evaluations || 2}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(((trialStatus?.current_usage?.evaluations_used || 0) / (trialStatus?.usage_limits?.evaluations || 2)) * 100, 100)} 
                              className="h-2" 
                            />
                          </div>
                          
                          {/* AI Insights Usage */}
                          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-emerald-300">AI Insights</span>
                              <span className="text-emerald-200">
                                {trialStatus?.current_usage?.analytics_insights_used || 0}/{trialStatus?.usage_limits?.analytics_insights || 10}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(((trialStatus?.current_usage?.analytics_insights_used || 0) / (trialStatus?.usage_limits?.analytics_insights || 10)) * 100, 100)} 
                              className="h-2" 
                            />
                          </div>
                          
                          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-300 font-medium">Unlimited Features</span>
                            </div>
                            <p className="text-blue-200 text-sm">
                              Habits tracking and trading journal entries are unlimited during your trial.
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    {/* Trial Management */}
                    <AccordionItem value="trial-management">
                      <AccordionTrigger className="text-emerald-300">Trial Management</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-4">
                        <div className="space-y-4">
                          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                            <h4 className="font-semibold text-emerald-300 mb-2">Upgrade to Premium</h4>
                            <p className="text-emerald-200/80 text-sm mb-4">
                              Get unlimited access to all features and remove usage limits.
                            </p>
                            <Button
                              onClick={() => window.location.href = '/pricing'}
                              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 text-white"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade Now
                            </Button>
                          </div>
                          
                          {!trialStatus?.has_cancelled && trialStatus?.can_cancel && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                              <h4 className="font-semibold text-red-300 mb-2">Cancel Trial</h4>
                              <p className="text-red-200/80 text-sm mb-4">
                                You can cancel your trial at any time. You'll continue to have access until the trial period ends.
                              </p>
                              <Button
                                onClick={handleCancelTrial}
                                disabled={cancelling}
                                variant="destructive"
                                size="sm"
                              >
                                {cancelling ? 'Cancelling...' : 'Cancel Trial'}
                              </Button>
                            </div>
                          )}
                          
                          {trialStatus?.has_cancelled && (
                            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-orange-400" />
                                <h4 className="font-semibold text-orange-300">Trial Cancelled</h4>
                              </div>
                              <p className="text-orange-200/80 text-sm">
                                Your trial has been cancelled. You can continue using TradingBait until {' '}
                                {trialStatus.trial_end_date 
                                  ? new Date(trialStatus.trial_end_date).toLocaleDateString()
                                  : 'the end of your trial period'
                                }.
                              </p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}
            
            {/* Billing & Subscription Section */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Billing & Subscription</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your subscription, payment methods, and billing history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  
                  {/* Current Plan */}
                  <AccordionItem value="current-plan">
                    <AccordionTrigger>Current Plan & Usage</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      {billingLoading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                          <div className="h-20 bg-gray-300 rounded"></div>
                        </div>
                      ) : (
                        <>
                          {/* Current Plan */}
                          <div className="border-2 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                <h4 className="font-semibold">Current Plan</h4>
                              </div>
                              
                              {billingInfo?.subscription && (
                                <Button
                                  onClick={handleCustomerPortal}
                                  disabled={actionLoading}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Manage Billing
                                </Button>
                              )}
                            </div>
                            
                            {billingInfo?.subscription ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold">
                                      {billingInfo.subscription.product_name}
                                    </h3>
                                    <p className="text-muted-foreground">
                                      {formatCurrency(billingInfo.subscription.price_amount, billingInfo.subscription.currency)}
                                      /{billingInfo.subscription.interval}
                                    </p>
                                  </div>
                                  {getStatusBadge(billingInfo.subscription.status)}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">Next Payment</p>
                                      <p className="text-sm text-muted-foreground">
                                        {billingInfo.subscription.next_payment_date 
                                          ? formatDate(billingInfo.subscription.next_payment_date)
                                          : 'N/A'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">Total Spent</p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatCurrency(billingInfo.total_spent)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">Member Since</p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(billingInfo.subscription.created)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {billingInfo.subscription.cancel_at_period_end && (
                                  <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      Your subscription will be cancelled at the end of the current billing period
                                      ({formatDate(billingInfo.subscription.current_period_end)}).
                                      <Button
                                        variant="link"
                                        className="p-0 h-auto font-normal ml-2"
                                        onClick={handleReactivateSubscription}
                                        disabled={actionLoading}
                                      >
                                        Reactivate subscription
                                      </Button>
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                {!billingInfo.subscription.cancel_at_period_end && billingInfo.subscription.status === 'active' && (
                                  <div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelSubscription}
                                      disabled={actionLoading}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      Cancel Subscription
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                                <p className="text-muted-foreground mb-4">
                                  Upgrade to unlock premium features and unlimited access
                                </p>
                                <Button onClick={handleSubscribe} disabled={isCreatingCheckout}>Choose a Plan</Button>
                              </div>
                            )}
                          </div>

                          {/* Usage Overview */}
                          {usageInfo && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5" />
                                <h4 className="font-semibold">Usage Overview</h4>
                                <span className="text-sm text-muted-foreground">({usageInfo.plan_name})</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Trades Usage */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Trades Imported</span>
                                    <span>
                                      {usageInfo.trades_count}
                                      {usageInfo.trades_limit ? ` / ${usageInfo.trades_limit}` : ' (Unlimited)'}
                                    </span>
                                  </div>
                                  {usageInfo.trades_limit && (
                                    <Progress 
                                      value={(usageInfo.trades_count / usageInfo.trades_limit) * 100} 
                                      className="h-2"
                                    />
                                  )}
                                </div>
                                
                                {/* Journal Entries */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Journal Entries</span>
                                    <span>{usageInfo.journal_entries_count}</span>
                                  </div>
                                </div>
                                
                                {/* AI Insights */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>AI Insights Used</span>
                                    <span>
                                      {usageInfo.ai_insights_used}
                                      {usageInfo.ai_insights_limit ? ` / ${usageInfo.ai_insights_limit}` : ' (Unlimited)'}
                                    </span>
                                  </div>
                                  {usageInfo.ai_insights_limit && (
                                    <Progress 
                                      value={(usageInfo.ai_insights_used / usageInfo.ai_insights_limit) * 100} 
                                      className="h-2"
                                    />
                                  )}
                                </div>
                              </div>
                              
                              <Separator className="my-4" />
                              
                              {/* Features */}
                              <div>
                                <h5 className="font-medium mb-3">Plan Features</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {usageInfo.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      {feature}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Methods */}
                  {billingInfo?.payment_methods && billingInfo.payment_methods.length > 0 && (
                    <AccordionItem value="payment-methods">
                      <AccordionTrigger>Payment Methods</AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-4">
                        {billingInfo.payment_methods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {method.card_brand?.toUpperCase()} ****{method.card_last4}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Expires {method.card_exp_month}/{method.card_exp_year}
                                </p>
                              </div>
                            </div>
                            {method.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Billing History */}
                  {billingInfo?.billing_history && billingInfo.billing_history.length > 0 && (
                    <AccordionItem value="billing-history">
                      <AccordionTrigger>Billing History</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {billingInfo.billing_history.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.created)}</TableCell>
                                <TableCell>{payment.description}</TableCell>
                                <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                                <TableCell>
                                  <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {payment.invoice_pdf && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(payment.invoice_pdf!, '_blank')}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {payment.receipt_url && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(payment.receipt_url!, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Privacy & Data Section */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>
                  Manage your data privacy settings and exercise your GDPR rights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  
                  {/* Cookie Preferences */}
                  <AccordionItem value="cookie-preferences">
                    <AccordionTrigger>Cookie Preferences</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage your cookie preferences. Changes will take effect on your next visit.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            localStorage.removeItem('tradingbait-cookie-consent');
                            localStorage.removeItem('tradingbait-cookie-preferences');
                            window.location.reload();
                          }}
                        >
                          Reset Cookie Preferences
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Data Export */}
                  <AccordionItem value="data-export">
                    <AccordionTrigger>Request My Data</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Download Your Personal Data</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get a copy of your personal information including account details, preferences, and settings. 
                          This does not include your trading analytics or journal entries, which you can export separately from their respective pages.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await brain.export_personal_data({}, {
                                include_trading_data: false,
                                include_journal_entries: false,
                                include_preferences: true
                              });
                              const exportData = await response.json();
                              
                              const blob = new Blob([JSON.stringify(exportData.export_data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `tradingbait-personal-data-${new Date().toISOString().split('T')[0]}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              toast.success('Personal data exported successfully');
                            } catch (error) {
                              console.error('Error exporting data:', error);
                              toast.error('Failed to export personal data');
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Personal Data
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Account Deletion */}
                  <AccordionItem value="account-deletion">
                    <AccordionTrigger>Delete My Account</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Account deletion is permanent and cannot be undone.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">What happens when you delete your account:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                          <li>• Your personal information (name, email, profile) will be permanently deleted</li>
                          <li>• Your subscription will be cancelled immediately</li>
                          <li>• Trading analytics and journal entries will be anonymized for research purposes</li>
                          <li>• Anonymized data cannot be traced back to you and helps improve our platform</li>
                          <li>• You will lose access to all platform features immediately</li>
                        </ul>
                        
                        <div className="border rounded-lg p-4 bg-background">
                          <h5 className="font-medium mb-2">Data Retention Policy:</h5>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <div className="flex justify-between">
                              <span>Personal Information:</span>
                              <span className="text-red-500 font-medium">Deleted immediately</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trading Analytics:</span>
                              <span className="text-blue-500 font-medium">Anonymized & retained</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Journal Insights:</span>
                              <span className="text-blue-500 font-medium">Anonymized & retained</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Platform Usage Data:</span>
                              <span className="text-blue-500 font-medium">Anonymized & retained</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="destructive" 
                          className="mt-4"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              'Are you absolutely sure you want to delete your account? This action cannot be undone.\n\n' +
                              'Type "DELETE MY ACCOUNT" in the next prompt to confirm.'
                            );
                            
                            if (confirmed) {
                              const confirmation = window.prompt(
                                'Please type "DELETE MY ACCOUNT" to confirm account deletion:'
                              );
                              
                              if (confirmation === 'DELETE MY ACCOUNT') {
                                try {
                                  const response = await brain.delete_account({}, {
                                    confirmation_text: confirmation,
                                    immediate_deletion: true
                                  });
                                  const result = await response.json();
                                  
                                  if (result.success) {
                                    toast.success('Account deletion initiated. You will be logged out shortly.');
                                    
                                    // Sign out from Firebase after successful backend deletion
                                    setTimeout(async () => {
                                      try {
                                        const { firebaseAuth } = await import('app');
                                        await firebaseAuth.signOut();
                                        window.location.href = '/';
                                      } catch (error) {
                                        console.error('Error signing out:', error);
                                        window.location.href = '/';
                                      }
                                    }, 2000);
                                  } else {
                                    toast.error('Account deletion failed: ' + result.message);
                                  }
                                } catch (error) {
                                  console.error('Error deleting account:', error);
                                  toast.error('Failed to delete account. Please try again or contact support.');
                                }
                              } else {
                                toast.error('Account deletion cancelled - confirmation text did not match.');
                              }
                            }
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Delete My Account Permanently
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  {/* Legal Information */}
                  <AccordionItem value="legal-info">
                    <AccordionTrigger>Legal Information</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Privacy Policy</p>
                            <p className="text-sm text-muted-foreground">How we collect and use your data</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href="/privacy-policy" target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Terms of Service</p>
                            <p className="text-sm text-muted-foreground">Platform usage terms and conditions</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href="/terms-of-service" target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h5 className="font-medium mb-2">Your Rights Under GDPR:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Right to access your personal data</li>
                            <li>• Right to rectification of inaccurate data</li>
                            <li>• Right to erasure ("right to be forgotten")</li>
                            <li>• Right to data portability</li>
                            <li>• Right to object to processing</li>
                            <li>• Right to restrict processing</li>
                          </ul>
                          <p className="text-sm text-muted-foreground mt-2">
                            For questions about your rights or to file a complaint, contact privacy@tradingbait.com
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                </Accordion>
              </CardContent>
            </Card>
            
            <ContactSupportForm />
            <CheckoutModal
              isOpen={isCheckoutModalOpen}
              onClose={() => setIsCheckoutModalOpen(false)}
              userEmail={user.email || ''}
              onCheckoutStart={() => setIsCreatingCheckout(true)}
              onCheckoutComplete={() => {
                setIsCreatingCheckout(false);
                setIsCheckoutModalOpen(false);
                fetchBillingData(); // Refresh billing data after checkout
              }}
            />
            <TrialStatusBanner trialStatus={trialStatus} />
          </div>
        </main>
      </div>
    </div>
  );
}
