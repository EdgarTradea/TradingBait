import React, { useState, useEffect } from 'react';
import { useUserGuardContext } from 'app';
import brain from 'utils/brain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateProfile {
  affiliate_id: string;
  full_name: string;
  email: string;
  company_name?: string;
  website_url?: string;
  status: string;
  referral_code: string;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_referrals: number;
  active_referrals: number;
  created_at: string;
}

interface AffiliateAnalytics {
  total_signups: number;
  total_conversions: number;
  conversion_rate: number;
  total_commissions_earned: number;
  active_subscribers: number;
}

const AffiliateDashboard: React.FC = () => {
  const { user } = useUserGuardContext();
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [analytics, setAnalytics] = useState<AffiliateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');
  
  // Registration form state
  const [formData, setFormData] = useState({
    full_name: user.displayName || '',
    email: user.email || '',
    company_name: '',
    website_url: '',
    social_media_handles: { youtube: '', twitter: '', instagram: '' },
    audience_size: '',
    audience_description: '',
    marketing_experience: '',
    referral_method: '',
    motivation: '',
    terms_accepted: false
  });

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      const response = await brain.get_affiliate_profile();
      console.log('Affiliate profile response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Affiliate profile data:', data);
        setProfile(data.profile);
        setAnalytics(data.analytics);
        setIsRegistered(true);
        
        // Generate referral URL if approved
        if (data.profile.status === 'approved') {
          generateReferralLink();
        }
      } else {
        // Response not ok, but no error thrown
        console.log('Affiliate profile request failed with status:', response.status);
        const errorData = await response.text();
        console.log('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
      // Only log as "not registered" if it's actually a 404
      if (error instanceof Error) {
        console.log('Detailed error:', error.message, error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setRegistering(true);
    try {
      const response = await brain.register_affiliate({
        ...formData,
        audience_size: formData.audience_size ? parseInt(formData.audience_size) : null
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        checkAffiliateStatus();
      } else {
        // Handle specific HTTP errors from the API
        try {
          const error = await response.json();
          toast.error(error.detail || 'Registration failed');
        } catch (parseError) {
          // If we can't parse the error response, fall back to status text
          toast.error(`Registration failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Network or other error during registration:', error);
      toast.error('Failed to submit registration - please check your connection and try again');
    } finally {
      setRegistering(false);
    }
  };

  const generateReferralLink = async () => {
    try {
      const response = await brain.generate_referral_link({});
      if (response.ok) {
        const data = await response.json();
        setReferralUrl(data.referral_url);
      }
    } catch (error) {
      console.error('Failed to generate referral link:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      suspended: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent mb-4">Join the TradingBait Affiliate Program</h1>
              <p className="text-gray-400 text-lg">
                Earn $15 fixed commission per successful conversion by referring traders to TradingBait
              </p>
            </div>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Affiliate Registration</CardTitle>
                <CardDescription className="text-gray-400">
                  Fill out the form below to apply for our affiliate program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistration} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="full_name" className="text-white">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company_name" className="text-white">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website_url" className="text-white">Website URL</Label>
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Social Media Handles</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        placeholder="YouTube Channel"
                        value={formData.social_media_handles.youtube}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media_handles: { ...formData.social_media_handles, youtube: e.target.value }
                        })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Input
                        placeholder="Twitter Handle"
                        value={formData.social_media_handles.twitter}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media_handles: { ...formData.social_media_handles, twitter: e.target.value }
                        })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Input
                        placeholder="Instagram Handle"
                        value={formData.social_media_handles.instagram}
                        onChange={(e) => setFormData({
                          ...formData,
                          social_media_handles: { ...formData.social_media_handles, instagram: e.target.value }
                        })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="audience_size" className="text-white">Audience Size (approximate)</Label>
                      <Input
                        id="audience_size"
                        type="number"
                        placeholder="e.g., 10000"
                        value={formData.audience_size}
                        onChange={(e) => setFormData({ ...formData, audience_size: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marketing_experience" className="text-white">Marketing Experience *</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, marketing_experience: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="referral_method" className="text-white">How do you plan to promote TradingBait? *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, referral_method: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select referral method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_creation">Content Creation (YouTube, Blog, etc.)</SelectItem>
                        <SelectItem value="direct_referral">Direct Referrals</SelectItem>
                        <SelectItem value="community">Community/Discord/Telegram</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience_description" className="text-white">Describe your audience *</Label>
                    <Textarea
                      id="audience_description"
                      placeholder="Tell us about your audience - demographics, interests, trading experience level, etc."
                      value={formData.audience_description}
                      onChange={(e) => setFormData({ ...formData, audience_description: e.target.value })}
                      required
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivation" className="text-white">Why do you want to become an affiliate? *</Label>
                    <Textarea
                      id="motivation"
                      placeholder="Tell us your motivation for joining our affiliate program"
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      required
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.terms_accepted}
                      onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="terms" className="text-white text-sm">
                      I accept the affiliate terms and conditions *
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={registering}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {registering ? 'Submitting...' : 'Apply for Affiliate Program'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent">Affiliate Dashboard</h1>
              <p className="text-gray-400 mt-2 text-lg">Welcome back, {profile?.full_name}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(profile?.status || 'pending')}
            </div>
          </div>

          {profile?.status === 'pending' && (
            <Alert className="bg-yellow-900/50 border-yellow-600">
              <AlertDescription className="text-yellow-200">
                Your affiliate application is under review. You'll be notified once approved.
              </AlertDescription>
            </Alert>
          )}

          {profile?.status === 'rejected' && (
            <Alert className="bg-red-900/50 border-red-600">
              <AlertDescription className="text-red-200">
                Your affiliate application was not approved. Please contact support for more information.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-400">Total Earnings</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{formatCurrency(profile?.total_earnings || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-400">Total Referrals</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{profile?.total_referrals || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-400">Active Subscribers</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{profile?.active_referrals || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-400">Conversion Rate</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{analytics?.conversion_rate?.toFixed(1) || 0}%</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="links" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="links" className="data-[state=active]:bg-gray-700">Referral Links</TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-gray-700">Earnings</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="space-y-6">
              {profile?.status === 'approved' && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Your Referral Link</CardTitle>
                    <CardDescription className="text-gray-400">
                      Share this link to earn commissions on successful referrals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={referralUrl}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-white flex-1"
                      />
                      <Button
                        onClick={() => copyToClipboard(referralUrl)}
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(referralUrl, '_blank')}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Commission Structure:</h4>
                      <ul className="text-gray-400 space-y-1">
                        <li>• $15 fixed commission per successful conversion</li>
                        <li>• One-time payment for each new paid subscriber</li>
                        <li>• Monthly payments on the 1st of each month</li>
                        <li>• Minimum payout: $100</li>
                        <li>• Customer gets 20% discount with your referral code</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="earnings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-white font-medium mb-2">Pending Earnings</h3>
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(profile?.pending_earnings || 0)}</p>
                    <p className="text-sm text-gray-400 mt-1">Will be paid next month</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-white font-medium mb-2">Paid Earnings</h3>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(profile?.paid_earnings || 0)}</p>
                    <p className="text-sm text-gray-400 mt-1">Total paid to date</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-white font-medium mb-2">Lifetime Total</h3>
                    <p className="text-xl font-bold text-white">{formatCurrency(profile?.total_earnings || 0)}</p>
                    <p className="text-sm text-gray-400 mt-1">All time earnings</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Analytics</CardTitle>
                  <CardDescription className="text-gray-400">
                    Track your affiliate performance and optimize your strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Total Signups</h4>
                      <p className="text-2xl font-bold text-blue-400">{analytics?.total_signups || 0}</p>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Conversions</h4>
                      <p className="text-2xl font-bold text-green-400">{analytics?.total_conversions || 0}</p>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Conversion Rate</h4>
                      <p className="text-2xl font-bold text-purple-400">{analytics?.conversion_rate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
