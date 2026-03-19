import { useState, useEffect } from "react";
import CookieConsentBanner from "react-cookie-consent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, Shield } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
};

export const CookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has previously set preferences
    const savedPreferences = localStorage.getItem('tradingbait-cookie-preferences');
    const consentGiven = localStorage.getItem('tradingbait-cookie-consent');
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
    
    if (consentGiven) {
      setHasConsented(true);
    }
  }, []);

  const savePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('tradingbait-cookie-preferences', JSON.stringify(newPreferences));
    localStorage.setItem('tradingbait-cookie-consent', 'true');
    setPreferences(newPreferences);
    setHasConsented(true);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptEssential = () => {
    savePreferences(defaultPreferences);
  };

  const handleCustomSave = () => {
    savePreferences(preferences);
  };

  if (hasConsented) {
    return null;
  }

  return (
    <>
      <CookieConsentBanner
        location="bottom"
        buttonText="Accept All"
        declineButtonText="Essential Only"
        enableDeclineButton
        onAccept={handleAcceptAll}
        onDecline={handleAcceptEssential}
        style={{
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          margin: "16px",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        }}
        buttonStyle={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
        }}
        declineButtonStyle={{
          background: "hsl(var(--secondary))",
          color: "hsl(var(--secondary-foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          marginRight: "8px",
        }}
      >
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">We value your privacy</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to enhance your experience, analyze performance, and provide personalized content. 
              Essential cookies are required for basic functionality.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Customize
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Cookie Preferences
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Essential Cookies */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Essential Cookies</CardTitle>
                            <CardDescription>
                              Required for basic website functionality and security
                            </CardDescription>
                          </div>
                          <Switch checked={true} disabled />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          These cookies are necessary for authentication, security, and core platform features. 
                          They cannot be disabled.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Analytics Cookies */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Analytics Cookies</CardTitle>
                            <CardDescription>
                              Help us understand how you use TradingBait
                            </CardDescription>
                          </div>
                          <Switch 
                            checked={preferences.analytics}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, analytics: checked }))
                            }
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          These cookies collect anonymous usage data to help us improve platform performance 
                          and user experience. No personal trading data is included.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Marketing Cookies */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Marketing Cookies</CardTitle>
                            <CardDescription>
                              Personalize content and relevant updates
                            </CardDescription>
                          </div>
                          <Switch 
                            checked={preferences.marketing}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, marketing: checked }))
                            }
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          These cookies help us show you relevant educational content, feature updates, 
                          and trading insights based on your interests.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCustomSave}>
                      Save Preferences
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CookieConsentBanner>
    </>
  );
};
