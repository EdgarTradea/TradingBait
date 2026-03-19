import React, { useState } from 'react';
import { useUserGuardContext } from 'app';
import brain from 'utils/brain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, User } from 'lucide-react';
import { toast } from 'sonner';

const AdminSetup: React.FC = () => {
  const { user } = useUserGuardContext();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getUserInfo = async () => {
    setLoading(true);
    try {
      const response = await brain.get_current_user_info();
      const data = await response.json();
      setUserInfo(data);
      toast.success('Firebase UID retrieved successfully!');
    } catch (error) {
      console.error('Failed to get user info:', error);
      toast.error('Failed to get Firebase UID');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Admin Setup Helper</h1>
          <p className="text-gray-400">Get your Firebase UID to set up admin access</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Current User Email:</label>
                <div className="text-lg">{user.email || 'No email available'}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Display Name:</label>
                <div className="text-lg">{user.displayName || 'No display name'}</div>
              </div>
            </div>

            <Button
              onClick={getUserInfo}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Getting Firebase UID...' : 'Get My Firebase UID'}
            </Button>

            {userInfo && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg space-y-3">
                <h3 className="font-semibold text-green-400">✅ Firebase UID Retrieved!</h3>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Your Firebase UID:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-900 rounded text-green-400 font-mono text-sm">
                      {userInfo.user_id}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(userInfo.user_id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Is Admin:</label>
                  <div className={`font-bold ${userInfo.is_admin ? 'text-green-400' : 'text-red-400'}`}>
                    {userInfo.is_admin ? 'YES' : 'NO'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Current Admin UIDs:</label>
                  <div className="space-y-1 mt-1">
                    {userInfo.admin_uids_configured?.map((uid: string, index: number) => (
                      <code key={index} className="block p-2 bg-gray-900 rounded text-yellow-400 font-mono text-sm">
                        {uid}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
                  <h4 className="font-semibold text-blue-400 mb-2">Next Steps:</h4>
                  <ol className="text-sm space-y-1 text-blue-200">
                    <li>1. Copy your Firebase UID above</li>
                    <li>2. Replace 'edgar_grau_firebase_uid' in the admin code with your actual UID</li>
                    <li>3. The admin dashboard will then be accessible at /admin-dashboard</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Need help? Contact support or check the admin setup documentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
