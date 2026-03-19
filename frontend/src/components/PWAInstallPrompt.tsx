import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";
import { isPWAInstallAvailable, showPWAInstallPrompt, isPWAInstalled } from "utils/pwaInstall";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    setIsInstalled(isPWAInstalled());
    
    // Show prompt if installation is available and not dismissed
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    if (isPWAInstallAvailable() && !isDismissed && !isPWAInstalled()) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    try {
      const installed = await showPWAInstallPrompt();
      if (installed) {
        setShowPrompt(false);
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  // Don't show if already installed or prompt is dismissed
  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80">
      <Card className="border-blue-500/50 bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-sm">Install TradingBait</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Get the app experience with offline access and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="border-gray-600"
            >
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
