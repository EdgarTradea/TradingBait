import React, { useState, useEffect } from 'react';
import { useUserGuardContext } from 'app';
import brain from 'utils/brain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, TrendingUp, DollarSign, Activity, Shield, Search, Lock, RefreshCw, Home, Link2, CheckCircle, XCircle, Clock, Percent, Gift, Calendar, Trash2, Edit, Plus, Mail, Download, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from 'components/Header';
import { Sidebar } from 'components/Sidebar';
import { useStore } from 'utils/store';

interface User {
  user_id: string;
  email: string;
  name?: string;
  subscription_status: 'active' | 'cancelled' | 'none' | 'free';
  access_status: string;
  granted_at: string;
  last_login?: string;
  subscription_type: string;
  admin_notes?: string;
}

interface AdminAnalytics {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  userGrowth: number;
  subscriptionRate: number;
}

interface SystemHealth {
  uptime: string;
  responseTime: number;
  errorRate: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface AffiliateItem {
  affiliate_id: string;
  full_name: string;
  email: string;
  company_name?: string;
  website_url?: string;
  status: string;
  referral_code: string;
  total_earnings: number;
  total_referrals: number;
  active_referrals: number;
  created_at: string;
  marketing_experience: string;
  referral_method: string;
}

interface AffiliateManagementData {
  affiliates: AffiliateItem[];
  total_count: number;
  pending_count: number;
  approved_count: number;
  total_earnings_paid: number;
  total_active_referrals: number;
}

interface AffiliateProgramAnalytics {
  overview: {
    total_affiliates: number;
    active_affiliates: number;
    total_referrals: number;
    total_conversions: number;
    conversion_rate: number;
    total_earnings_paid: number;
    total_earnings_pending: number;
  };
  status_breakdown: Record<string, number>;
  commission_summary: {
    total_paid: number;
    total_pending: number;
    total_committed: number;
  };
}

// Discount Management Interfaces
interface DiscountCode {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_trial';
  value: number;
  max_uses?: number;
  max_uses_per_user: number;
  current_uses: number;
  expires_at?: string;
  minimum_amount?: number;
  description?: string;
  active: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  stripe_coupon_id?: string;
}

interface DiscountAnalytics {
  total_discounts: number;
  active_discounts: number;
  total_uses: number;
  total_savings: number;
  total_revenue_impact: number;
  top_performing_codes: Array<{
    code: string;
    name: string;
    uses: number;
    type: string;
    value: number;
  }>;
  usage_by_month: Array<{
    month: string;
    uses: number;
    savings: number;
  }>;
}

// Early Access Management Interfaces
interface EarlyAccessSignup {
  email: string;
  signup_date: string;
  confirmed: boolean;
  source: string;
  user_agent?: string;
  ip_address?: string;
}

interface EarlyAccessStats {
  total_signups: number;
  confirmed_signups: number;
  confirmation_rate: number;
  signups_today: number;
  signups_this_week: number;
  signups_this_month: number;
}

interface EarlyAccessResponse {
  signups: EarlyAccessSignup[];
  stats: EarlyAccessStats;
  total_count: number;
}

const AdminDashboard = () => {
  const { user } = useUserGuardContext();
  const { isSidebarCollapsed } = useStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Affiliate management state
  const [affiliateData, setAffiliateData] = useState<AffiliateManagementData | null>(null);
  const [affiliateAnalytics, setAffiliateAnalytics] = useState<AffiliateProgramAnalytics | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateItem | null>(null);
  const [showAffiliateDialog, setShowAffiliateDialog] = useState(false);
  const [affiliateSearchTerm, setAffiliateSearchTerm] = useState('');
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState<string>('all');
  const [affiliateLoading, setAffiliateLoading] = useState(true);

  // Discount management state
  const [discountData, setDiscountData] = useState<DiscountCode[]>([]);
  const [discountAnalytics, setDiscountAnalytics] = useState<DiscountAnalytics | null>(null);
  const [discountLoading, setDiscountLoading] = useState(true);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCreateDiscountDialog, setShowCreateDiscountDialog] = useState(false);
  const [discountSearchTerm, setDiscountSearchTerm] = useState('');
  const [discountStatusFilter, setDiscountStatusFilter] = useState<string>('all');
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    name: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_trial',
    value: 0,
    max_uses: undefined as number | undefined,
    max_uses_per_user: 1,
    expires_at: '',
    minimum_amount: undefined as number | undefined,
    description: '',
    active: true
  });

  // Early Access management state
  const [earlyAccessData, setEarlyAccessData] = useState<EarlyAccessResponse | null>(null);
  const [earlyAccessSearchTerm, setEarlyAccessSearchTerm] = useState('');
  const [earlyAccessStatusFilter, setEarlyAccessStatusFilter] = useState<string>('all');

  const [activeTab, setActiveTab] = useState('users');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['users']));

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await brain.test_admin();
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
        if (data.isAdmin) {
          // Only load essential users data initially
          loadDashboardData();
        }
      }
    } catch (error) {
      console.log('Admin access denied');
      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
      setLoading(false);
    }
  };

  // Handle tab changes and lazy load data
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    
    // Lazy load data for tabs that haven't been loaded yet
    if (!loadedTabs.has(tabValue)) {
      setLoadedTabs(prev => new Set([...prev, tabValue]));
      
      switch (tabValue) {
        case 'affiliates':
          loadAffiliateData();
          break;
        case 'discounts':
          loadDiscountData();
          break;
        case 'early-access':
          loadEarlyAccessData();
          break;
        // users and subscriptions data is already loaded in loadDashboardData
        // system data is lightweight and loaded with main data
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Only call the endpoint that exists
      const usersResponse = await brain.list_all_users();
      
      if (!usersResponse.ok) {
        throw new Error('Failed to load users');
      }
      
      const usersData = await usersResponse.json();
      
      // Calculate basic analytics from user data
      const totalUsers = usersData?.length || 0;
      const activeSubscribers = usersData?.filter((u: any) => u.subscription_status === 'active').length || 0;
      const conversionRate = totalUsers > 0 ? (activeSubscribers / totalUsers) * 100 : 0;
      
      // Get real revenue data from Stripe business metrics
      let monthlyRevenue = 0;
      try {
        const businessMetricsResponse = await brain.get_comprehensive_business_metrics({ months: 1 });
        if (businessMetricsResponse.ok) {
          const businessData = await businessMetricsResponse.json();
          console.log('Business metrics data:', businessData);
          // Use MRR (Monthly Recurring Revenue) from Stripe
          monthlyRevenue = businessData.subscription_metrics?.mrr || 
                          businessData.key_metrics?.monthly_revenue || 
                          businessData.mrr || 
                          businessData.monthly_revenue || 
                          0;
        }
      } catch (revenueError) {
        console.log('Business metrics unavailable, trying basic business metrics:', revenueError);
        try {
          const basicMetricsResponse = await brain.get_business_metrics();
          if (basicMetricsResponse.ok) {
            const basicData = await basicMetricsResponse.json();
            console.log('Basic business metrics data:', basicData);
            monthlyRevenue = basicData.monthly_revenue || basicData.mrr || 0;
          }
        } catch (basicError) {
          console.log('All revenue data unavailable, using subscriber calculation:', basicError);
          // Fallback to basic calculation only if Stripe data unavailable
          const professionalSubscribers = usersData?.filter((u: any) => u.subscription_type === 'professional' && u.subscription_status === 'active').length || 0;
          monthlyRevenue = professionalSubscribers * 49; // Only as last resort
        }
      }
      
      console.log('Final monthly revenue:', monthlyRevenue);
      
      // Try to get system health from infrastructure endpoint
      let systemHealthData = {
        uptime: 'Unknown',
        responseTime: 0,
        errorRate: 0,
        status: 'unknown' as const
      };
      
      try {
        const healthResponse = await brain.get_infrastructure_health();
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          systemHealthData = {
            uptime: healthData.uptime || 'Unknown',
            responseTime: healthData.response_time || 0,
            errorRate: healthData.error_rate || 0,
            status: healthData.status || 'unknown'
          };
        }
      } catch (healthError) {
        console.log('System health data unavailable:', healthError);
      }
      
      // usersData is directly an array, not an object with users property
      setUsers(usersData || []);
      setAnalytics({
        totalUsers,
        activeSubscribers,
        monthlyRevenue,
        userGrowth: 0, // Would need historical data
        subscriptionRate: conversionRate
      });
      setSystemHealth(systemHealthData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateData = async () => {
    try {
      setAffiliateLoading(true);
      const [affiliatesResponse, analyticsResponse] = await Promise.all([
        brain.list_affiliates(),
        brain.get_affiliate_program_analytics()
      ]);
      
      if (affiliatesResponse.ok) {
        const affiliatesData = await affiliatesResponse.json();
        setAffiliateData(affiliatesData);
      }
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAffiliateAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
      toast.error('Failed to load affiliate data');
    } finally {
      setAffiliateLoading(false);
    }
  };

  const loadDiscountData = async () => {
    try {
      setDiscountLoading(true);
      const [discountsResponse, analyticsResponse] = await Promise.all([
        brain.list_discounts({ active_only: false }),
        brain.get_discount_analytics()
      ]);
      
      if (discountsResponse.ok) {
        const discountData = await discountsResponse.json();
        setDiscountData(discountData);
      }
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setDiscountAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Failed to load discount data:', error);
      toast.error('Failed to load discount data');
    } finally {
      setDiscountLoading(false);
    }
  };

  const loadEarlyAccessData = async () => {
    try {
      setLoading(true);
      const response = await brain.get_early_access_signups();
      
      if (response.ok) {
        const data = await response.json();
        setEarlyAccessData(data);
      }
    } catch (error) {
      console.error('Failed to load early access data:', error);
      toast.error('Failed to load early access data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async () => {
    try {
      setProcessing(true);
      
      // Format the discount data before sending
      const discountData = {
        ...newDiscount,
        // Convert empty string to null for optional datetime field
        expires_at: newDiscount.expires_at ? newDiscount.expires_at : null,
        // Ensure numeric fields are properly typed
        value: Number(newDiscount.value),
        max_uses: newDiscount.max_uses ? Number(newDiscount.max_uses) : null,
        max_uses_per_user: Number(newDiscount.max_uses_per_user),
        minimum_amount: newDiscount.minimum_amount ? Number(newDiscount.minimum_amount) : null
      };
      
      const response = await brain.create_discount(discountData);
      
      if (response.ok) {
        toast.success('Discount created successfully');
        setShowCreateDiscountDialog(false);
        setNewDiscount({
          code: '',
          name: '',
          discount_type: 'percentage',
          value: 0,
          max_uses: undefined,
          max_uses_per_user: 1,
          expires_at: '',
          minimum_amount: undefined,
          description: '',
          active: true
        });
        loadDiscountData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create discount');
      }
    } catch (error) {
      console.error('Failed to create discount:', error);
      toast.error('Failed to create discount');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleDiscountStatus = async (discountId: string, newStatus: boolean) => {
    try {
      setProcessing(true);
      const response = await brain.update_discount({ discountId }, { active: newStatus });
      
      if (response.ok) {
        toast.success(`Discount ${newStatus ? 'activated' : 'deactivated'} successfully`);
        setShowDiscountDialog(false);
        loadDiscountData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update discount');
      }
    } catch (error) {
      console.error('Failed to update discount:', error);
      toast.error('Failed to update discount');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    try {
      setProcessing(true);
      const response = await brain.delete_discount({ discountId });
      
      if (response.ok) {
        toast.success('Discount deleted successfully');
        setShowDiscountDialog(false);
        loadDiscountData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete discount');
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      toast.error('Failed to delete discount');
    } finally {
      setProcessing(false);
    }
  };

  const handleGrantSubscription = async (userId: string) => {
    try {
      setProcessing(true);
      await brain.grant_subscription({
        user_id: userId,
        subscription_type: "professional",
        subscription_status: "active",
        subscription_notes: "Granted via admin dashboard"
      });
      toast.success('Subscription granted successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to grant subscription:', error);
      toast.error('Failed to grant subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeSubscription = async (userId: string) => {
    try {
      setProcessing(true);
      await brain.revoke_subscription({
        user_id: userId,
        subscription_type: "free",
        subscription_status: "cancelled",
        subscription_notes: "Revoked via admin dashboard"
      });
      toast.success('Subscription revoked successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to revoke subscription:', error);
      toast.error('Failed to revoke subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAffiliate = async (affiliateId: string) => {
    try {
      setProcessing(true);
      const response = await brain.approve_affiliate({ 
        affiliate_id: affiliateId, 
        action: "approve" 
      });
      
      if (response.ok) {
        toast.success('Affiliate approved successfully');
        await loadAffiliateData(); // Reload data
      } else {
        toast.error('Failed to approve affiliate');
      }
    } catch (error) {
      console.error('Failed to approve affiliate:', error);
      toast.error('Failed to approve affiliate');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeAffiliate = async (affiliateId: string) => {
    try {
      setProcessing(true);
      // Note: This would need a revoke endpoint to be implemented
      toast.error('Revoke functionality not implemented yet');
    } catch (error) {
      console.error('Failed to revoke affiliate:', error);
      toast.error('Failed to revoke affiliate');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while checking admin status
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-9900 to-gray-950">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} p-8`}>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Checking admin access...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} p-8`}>
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    Access Denied
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    You don't have admin privileges to access this dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300">
                    This area is restricted to administrators only. If you believe you should have access, please contact support.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => checkAdminAccess()}
                      variant="outline" 
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Access Check
                    </Button>
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Manage users, subscriptions, and monitor system health</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/business-analytics')}
              variant="outline"
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-white hover:text-blue-300 transition-all duration-300"
            >
              <Activity className="h-4 w-4 mr-2" />
              Business Analytics
            </Button>
            <Button 
              onClick={loadDashboardData} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
                <p className="text-xs text-emerald-400">+{analytics.userGrowth}% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.activeSubscribers}</div>
                <p className="text-xs text-emerald-400">{analytics.subscriptionRate}% conversion rate</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${analytics.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-400">$24.99 per subscription</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">System Health</CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
                    {systemHealth?.status || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{systemHealth?.uptime} uptime</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliate Management</TabsTrigger>
            <TabsTrigger value="discounts">Discount Management</TabsTrigger>
            <TabsTrigger value="early-access">Early Access</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts and subscription status
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-gray-800 border-gray-700"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined: {new Date(user.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status === 'active' ? 'Subscribed' : 
                           user.subscription_status === 'cancelled' ? 'Cancelled' : 
                           user.subscription_status === 'no_subscription' ? 'No Subscription' : 'Free'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 hover:bg-gray-700"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Subscription Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor subscription metrics and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-300">Active Subscriptions</h3>
                      <p className="text-2xl font-bold text-emerald-400">{analytics?.activeSubscribers || 0}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-300">Monthly Revenue</h3>
                      <p className="text-2xl font-bold text-blue-400">${analytics?.monthlyRevenue.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-300">Conversion Rate</h3>
                      <p className="text-2xl font-bold text-purple-400">{analytics?.subscriptionRate || 0}%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <h3 className="font-medium mb-2 text-gray-300">Pricing Information</h3>
                    <p className="text-gray-400">Current subscription price: <span className="font-bold text-white">$24.99/month</span></p>
                    <p className="text-gray-400">Professional trading journal and analytics platform</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">System Status</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor system health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">System Status</h3>
                        <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'} className="mt-2">
                          {systemHealth.status}
                        </Badge>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">Uptime</h3>
                        <p className="text-2xl font-bold text-emerald-400">{systemHealth.uptime}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">Response Time</h3>
                        <p className="text-2xl font-bold text-blue-400">{systemHealth.responseTime}ms</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-300">Error Rate</h3>
                      <p className="text-lg font-bold text-orange-400">{systemHealth.errorRate}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliates">
            {affiliateLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-2 text-gray-400">Loading affiliate data...</span>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Affiliate Management
                    </h2>
                    <p className="text-gray-400">Monitor and manage affiliate partnerships</p>
                  </div>
                  <Button 
                    onClick={() => loadAffiliateData()} 
                    disabled={affiliateLoading}
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-700"
                  >
                    Refresh Data
                  </Button>
                </div>

                {/* Affiliate Analytics Overview */}
                {affiliateAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-300">Total Conversions</h3>
                      <p className="text-2xl font-bold text-emerald-400">{affiliateAnalytics.total_conversions || 0}</p>
                      <p className="text-sm text-gray-400">Paid subscriptions</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-300">Commission Paid</h3>
                      <p className="text-2xl font-bold text-blue-400">${(affiliateAnalytics.total_commissions_paid || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-400">At $20 per conversion</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-300">Active Affiliates</h3>
                      <p className="text-2xl font-bold text-purple-400">{affiliateAnalytics.active_affiliates || 0}</p>
                      <p className="text-sm text-gray-400">Approved partners</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <h3 className="font-medium text-gray-300">Conversion Rate</h3>
                      <p className="text-2xl font-bold text-orange-400">{affiliateAnalytics.conversion_rate?.toFixed(1) || 0}%</p>
                      <p className="text-sm text-gray-400">Signup to paid rate</p>
                    </div>
                  </div>
                )}

                {affiliateData && (
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search affiliates by email or name..."
                        value={affiliateSearchTerm}
                        onChange={(e) => setAffiliateSearchTerm(e.target.value)}
                        className="max-w-sm bg-gray-800 border-gray-700"
                      />
                      <Select
                        value={affiliateStatusFilter}
                        onValueChange={(value) => setAffiliateStatusFilter(value)}
                        className="max-w-sm"
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-4">
                      {affiliateData.affiliates.filter(affiliate => 
                        affiliate.email.toLowerCase().includes(affiliateSearchTerm.toLowerCase()) ||
                        affiliate.full_name?.toLowerCase().includes(affiliateSearchTerm.toLowerCase())
                      ).filter(affiliate => 
                        affiliateStatusFilter === 'all' || affiliate.status === affiliateStatusFilter
                      ).map(affiliate => (
                        <div key={affiliate.affiliate_id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-4">
                          <div className="space-y-1">
                            <p className="font-medium text-white">{affiliate.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">
                              {affiliate.email}
                            </p>
                            <p className="text-xs text-gray-400">
                              Joined: {new Date(affiliate.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={affiliate.status === 'approved' ? 'default' : 'secondary'}>
                              {affiliate.status === 'approved' ? 'Approved' : 
                               affiliate.status === 'pending' ? 'Pending' : 'Unknown'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowAffiliateDialog(true);
                              }}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discounts">
            {discountLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-2 text-gray-400">Loading discount data...</span>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Discount Management
                    </h2>
                    <p className="text-gray-400">
                      Monitor and manage discount codes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowCreateDiscountDialog(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Discount
                    </Button>
                    <Button 
                      onClick={() => loadDiscountData()} 
                      disabled={discountLoading}
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      Refresh Data
                    </Button>
                  </div>
                </div>

                {discountData && (
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search discount codes by name or code..."
                        value={discountSearchTerm}
                        onChange={(e) => setDiscountSearchTerm(e.target.value)}
                        className="max-w-sm bg-gray-800 border-gray-700"
                      />
                      <Select
                        value={discountStatusFilter}
                        onValueChange={(value) => setDiscountStatusFilter(value)}
                        className="max-w-sm"
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-4">
                      {discountData.filter(discount => 
                        discount.name.toLowerCase().includes(discountSearchTerm.toLowerCase()) ||
                        discount.code.toLowerCase().includes(discountSearchTerm.toLowerCase())
                      ).filter(discount => 
                        discountStatusFilter === 'all' || (discount.active ? 'active' : 'inactive') === discountStatusFilter
                      ).map(discount => (
                        <div key={discount.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-1">
                          <div className="space-y-1">
                            <p className="font-medium text-white">{discount.name}</p>
                            <p className="text-sm text-gray-400">
                              {discount.code}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(discount.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={discount.active ? 'default' : 'secondary'}>
                              {discount.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedDiscount(discount);
                                setShowDiscountDialog(true);
                              }}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {discountAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Total Discounts</CardTitle>
                        <Gift className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{discountAnalytics.total_discounts}</div>
                        <p className="text-xs text-emerald-400">{discountAnalytics.active_discounts} active</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Total Uses</CardTitle>
                        <Activity className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{discountAnalytics.total_uses}</div>
                        <p className="text-xs text-gray-400">Across all codes</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Total Savings</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">${discountAnalytics.total_savings.toFixed(2)}</div>
                        <p className="text-xs text-gray-400">Customer savings</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Revenue Impact</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">${discountAnalytics.total_revenue_impact.toFixed(2)}</div>
                        <p className="text-xs text-gray-400">Generated revenue</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="early-access">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Early Access Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor and manage early access signups
                </CardDescription>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search early access signups by email..."
                      value={earlyAccessSearchTerm}
                      onChange={(e) => setEarlyAccessSearchTerm(e.target.value)}
                      className="max-w-sm bg-gray-800 border-gray-700"
                    />
                    <Select
                      value={earlyAccessStatusFilter}
                      onValueChange={(value) => setEarlyAccessStatusFilter(value)}
                    >
                      <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => loadEarlyAccessData()} 
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : earlyAccessData ? (
                  <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-300">Total Signups</h3>
                            <p className="text-2xl font-bold text-emerald-400">{earlyAccessData.stats.total_signups}</p>
                          </div>
                          <Mail className="h-8 w-8 text-emerald-500" />
                        </div>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-300">Confirmed</h3>
                            <p className="text-2xl font-bold text-blue-400">{earlyAccessData.stats.confirmed_signups}</p>
                          </div>
                          <UserCheck className="h-8 w-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-300">Confirmation Rate</h3>
                            <p className="text-2xl font-bold text-purple-400">{earlyAccessData.stats.confirmation_rate}%</p>
                          </div>
                          <Percent className="h-8 w-8 text-purple-500" />
                        </div>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">Today</h3>
                        <p className="text-xl font-bold text-emerald-400">{earlyAccessData.stats.signups_today}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">This Week</h3>
                        <p className="text-xl font-bold text-emerald-400">{earlyAccessData.stats.signups_this_week}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-300">This Month</h3>
                        <p className="text-xl font-bold text-emerald-400">{earlyAccessData.stats.signups_this_month}</p>
                      </div>
                    </div>

                    {/* Signups List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Signups ({earlyAccessData.total_count})</h3>
                      {earlyAccessData.signups
                        .filter(signup => 
                          signup.email.toLowerCase().includes(earlyAccessSearchTerm.toLowerCase())
                        )
                        .filter(signup => 
                          earlyAccessStatusFilter === 'all' || 
                          (earlyAccessStatusFilter === 'confirmed' && signup.confirmed) ||
                          (earlyAccessStatusFilter === 'unconfirmed' && !signup.confirmed)
                        )
                        .map(signup => (
                          <div key={signup.email} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <div className="space-y-1">
                              <p className="font-medium text-white flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {signup.email}
                              </p>
                              <p className="text-sm text-gray-400">
                                Signed up: {new Date(signup.signup_date).toLocaleDateString()} at {new Date(signup.signup_date).toLocaleTimeString()}
                              </p>
                              {signup.source && (
                                <p className="text-xs text-gray-500">
                                  Source: {signup.source}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={signup.confirmed ? 'default' : 'secondary'}>
                                {signup.confirmed ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Confirmed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Unconfirmed
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        ))
                      }
                      {earlyAccessData.signups.length === 0 && (
                        <div className="text-center py-8">
                          <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No early access signups yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Click "Refresh Data" to load early access signups.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Management Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Manage User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update subscription status for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Current Status</Label>
                  <Badge variant={selectedUser.subscription_status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {selectedUser.subscription_status === 'active' ? 'Subscribed' : 
                     selectedUser.subscription_status === 'cancelled' ? 'Cancelled' : 
                     selectedUser.subscription_status === 'no_subscription' ? 'No Subscription' : 'Free'}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowUserDialog(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              {selectedUser?.subscription_status !== 'active' ? (
                <Button 
                  onClick={() => {
                    handleGrantSubscription(selectedUser!.user_id);
                    setShowUserDialog(false);
                  }}
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Grant Subscription
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleRevokeSubscription(selectedUser!.user_id);
                    setShowUserDialog(false);
                  }}
                  disabled={processing}
                >
                  Revoke Subscription
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Affiliate Management Dialog */}
        <Dialog open={showAffiliateDialog} onOpenChange={setShowAffiliateDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Manage Affiliate</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update affiliate status for {selectedAffiliate?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedAffiliate && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <p className="text-sm text-gray-400">{selectedAffiliate.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Current Status</Label>
                  <Badge variant={selectedAffiliate.status === 'approved' ? 'default' : 'secondary'} className="ml-2">
                    {selectedAffiliate.status === 'approved' ? 'Approved' : 
                     selectedAffiliate.status === 'pending' ? 'Pending' : 'Unknown'}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAffiliateDialog(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              {selectedAffiliate?.status !== 'approved' ? (
                <Button 
                  onClick={() => {
                    handleApproveAffiliate(selectedAffiliate!.affiliate_id);
                    setShowAffiliateDialog(false);
                  }}
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve Affiliate
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleRevokeAffiliate(selectedAffiliate!.affiliate_id);
                    setShowAffiliateDialog(false);
                  }}
                  disabled={processing}
                >
                  Revoke Affiliate
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discount Management Dialog */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Manage Discount</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update discount status for {selectedDiscount?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedDiscount && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Name</Label>
                  <p className="text-sm text-gray-400">{selectedDiscount.name}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Code</Label>
                  <p className="text-sm text-gray-400">{selectedDiscount.code}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Current Status</Label>
                  <Badge variant={selectedDiscount.active ? 'default' : 'secondary'} className="ml-2">
                    {selectedDiscount.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDiscountDialog(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              {selectedDiscount?.active ? (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleToggleDiscountStatus(selectedDiscount!.id, false);
                  }}
                  disabled={processing}
                >
                  Deactivate Discount
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    handleToggleDiscountStatus(selectedDiscount!.id, true);
                  }}
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Activate Discount
                </Button>
              )}
              <Button 
                onClick={() => {
                  handleDeleteDiscount(selectedDiscount!.id);
                }}
                disabled={processing}
                variant="destructive"
              >
                Delete Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Discount Dialog */}
        <Dialog open={showCreateDiscountDialog} onOpenChange={setShowCreateDiscountDialog}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create Discount</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new discount code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Code</Label>
                <Input
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Name</Label>
                <Input
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Discount Type</Label>
                <Select
                  value={newDiscount.discount_type}
                  onValueChange={(value) => setNewDiscount({ ...newDiscount, discount_type: value as 'percentage' | 'fixed_amount' | 'free_trial' })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Value</Label>
                <Input
                  value={newDiscount.value}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Uses</Label>
                <Input
                  value={newDiscount.max_uses}
                  onChange={(e) => setNewDiscount({ ...newDiscount, max_uses: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Uses per User</Label>
                <Input
                  value={newDiscount.max_uses_per_user}
                  onChange={(e) => setNewDiscount({ ...newDiscount, max_uses_per_user: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Expires At</Label>
                <Input
                  type="datetime-local"
                  value={newDiscount.expires_at}
                  onChange={(e) => setNewDiscount({ ...newDiscount, expires_at: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Optional expiration date"
                />
              </div>
              <div>
                <Label className="text-gray-300">Minimum Amount</Label>
                <Input
                  value={newDiscount.minimum_amount}
                  onChange={(e) => setNewDiscount({ ...newDiscount, minimum_amount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={newDiscount.description}
                  onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Active</Label>
                <Select
                  value={newDiscount.active ? 'true' : 'false'}
                  onValueChange={(value) => setNewDiscount({ ...newDiscount, active: value === 'true' })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select active status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDiscountDialog(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  handleCreateDiscount();
                }}
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
