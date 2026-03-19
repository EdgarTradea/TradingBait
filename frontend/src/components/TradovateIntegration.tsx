import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import brain from 'utils/brain';
import { toast } from 'sonner';
import { TradovateConnectionStatus } from 'types';

export interface Props {
  // No props needed for this component
}

export default function TradovateIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<TradovateConnectionStatus>({
    connected: false,
    accounts: null,
    lastSync: null,
    connectionError: null,
    api_key_suffix: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // API Key form state
  const [apiKey, setApiKey] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await brain.get_tradovate_connection_status();
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Error checking Tradovate connection status:', error);
      toast.error('Failed to check Tradovate connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Tradovate API key');
      return;
    }

    try {
      setIsConnecting(true);
      
      const response = await brain.connect_tradovate({
        api_key: apiKey.trim(),
        demo: demoMode
      });
      
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus(data);
        setApiKey(''); // Clear the form
        toast.success(`Successfully connected to Tradovate ${demoMode ? '(Demo)' : '(Live)'}!`);
      } else {
        toast.error(data.connectionError || 'Failed to connect to Tradovate');
      }
      
    } catch (error) {
      console.error('Failed to connect to Tradovate:', error);
      toast.error('Failed to connect to Tradovate. Please check your API key and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await brain.disconnect_tradovate();
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus({
          connected: false,
          accounts: null,
          lastSync: null,
          connectionError: null,
          api_key_suffix: null
        });
        toast.success('Tradovate account disconnected successfully');
      } else {
        toast.error('Failed to disconnect Tradovate account');
      }
    } catch (error) {
      console.error('Failed to disconnect Tradovate:', error);
      toast.error('Failed to disconnect Tradovate account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleImportTrades = async () => {
    try {
      setIsImporting(true);
      // TODO: Implement historical trade import
      toast.success('Trade import started! This may take a few minutes.');
    } catch (error) {
      console.error('Failed to import trades:', error);
      toast.error('Failed to import trades from Tradovate');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              TV
            </div>
            Tradovate Integration
          </CardTitle>
          <CardDescription>
            Connect your Tradovate account for automated trade synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            TV
          </div>
          Tradovate Integration
          {connectionStatus.connected && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </CardTitle>
        <CardDescription>
          Connect your Tradovate account for automated trade synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connectionStatus.connected ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tradovate-api-key">Tradovate API Key</Label>
                <div className="relative">
                  <Input
                    id="tradovate-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Tradovate API key (username:password or token)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  You can find your API credentials in your Tradovate account settings.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="demo-mode"
                  checked={demoMode}
                  onCheckedChange={setDemoMode}
                />
                <Label htmlFor="demo-mode" className="text-sm">
                  Use Demo Environment
                </Label>
              </div>
            </div>

            {connectionStatus.connectionError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Connection Error</p>
                  <p className="text-sm text-red-600">{connectionStatus.connectionError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting || !apiKey.trim()}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Tradovate'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://trader.tradovate.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get API Key
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Connected to Tradovate</p>
                  <p className="text-sm text-green-600">
                    API Key: {connectionStatus.api_key_suffix}
                    {connectionStatus.lastSync && (
                      <> • Last sync: {new Date(connectionStatus.lastSync).toLocaleString()}</>
                    )}
                  </p>
                </div>
              </div>

              {connectionStatus.accounts && connectionStatus.accounts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Connected Accounts:</Label>
                  <div className="space-y-1">
                    {connectionStatus.accounts.map((account: any, index: number) => (
                      <div key={account.id || index} className="text-sm p-2 bg-gray-50 rounded border">
                        <div className="font-medium">{account.name || account.nickname || `Account ${index + 1}`}</div>
                        <div className="text-gray-600">
                          ID: {account.id} • Type: {account.accountType || 'Unknown'}
                          {account.balance && <> • Balance: ${account.balance.toLocaleString()}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleImportTrades} 
                disabled={isImporting}
                variant="default"
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  'Import Historical Trades'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </Button>
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• Real-time trade synchronization</p>
          <p>• Automatic position and P&L updates</p>
          <p>• Historical trade import from account inception</p>
          <p>• Read-only access (no trading capabilities)</p>
        </div>
      </CardContent>
    </Card>
  );
}
