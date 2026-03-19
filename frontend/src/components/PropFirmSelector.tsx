import { useState, useEffect } from "react";
import { useUserGuardContext } from "app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import brain from "utils/brain";

interface PropFirmInfo {
  name: string;
  commission_structures: Record<string, number>;
  description: string;
}

interface Props {
  onPropFirmChange?: (propFirm: string) => void;
}

export function PropFirmSelector({ onPropFirmChange }: Props) {
  const { user } = useUserGuardContext();
  const [availableFirms, setAvailableFirms] = useState<Record<string, string>>({});
  const [currentSelection, setCurrentSelection] = useState<string>("");
  const [commissionInfo, setCommissionInfo] = useState<PropFirmInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customRate, setCustomRate] = useState<string>("");

  // Load available prop firms and user's current selection
  useEffect(() => {
    const loadPropFirmData = async () => {
      try {
        setLoading(true);
        
        // Get available prop firms and user's current selection
        const response = await brain.get_available_prop_firms();
        
        if (response.ok) {
          const data = await response.json();
          setAvailableFirms(data.available_firms || {});
          setCurrentSelection(data.current_selection || "custom");
          setCommissionInfo(data.commission_info);
        } else {
          console.error("Failed to load prop firm data");
          toast.error("Failed to load prop firm data");
        }
      } catch (error) {
        console.error("Error loading prop firm data:", error);
        toast.error("Error loading prop firm settings");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPropFirmData();
    }
  }, [user]);

  // Handle prop firm selection change
  const handlePropFirmChange = async (propFirm: string) => {
    try {
      setSaving(true);
      
      const requestBody: any = {
        prop_firm: propFirm
      };
      
      // Add custom commission rate if "custom" is selected
      if (propFirm === "custom" && customRate) {
        const rate = parseFloat(customRate);
        if (!isNaN(rate) && rate > 0) {
          requestBody.custom_commission_rate = rate;
        }
      }
      
      const response = await brain.set_user_prop_firm_preference(requestBody);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSelection(propFirm);
        setCommissionInfo(data.commission_info);
        toast.success(data.message || "Prop firm preference updated");
        
        // Notify parent component
        if (onPropFirmChange) {
          onPropFirmChange(propFirm);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to update prop firm preference");
      }
    } catch (error) {
      console.error("Error updating prop firm preference:", error);
      toast.error("Error updating prop firm preference");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5" />
            Prop Firm Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading prop firm settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Building2 className="h-5 w-5" />
          Prop Firm Settings
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Select your prop firm for accurate commission calculations in P&L analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prop Firm Selection */}
        <div className="space-y-2">
          <Label htmlFor="prop-firm-select" className="text-gray-300">
            Select Prop Firm
          </Label>
          <Select
            value={currentSelection}
            onValueChange={handlePropFirmChange}
            disabled={saving}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select a prop firm..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {Object.entries(availableFirms).map(([key, name]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Commission Rate Input (only for "custom" selection) */}
        {currentSelection === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-rate" className="text-gray-300">
              Custom Commission Rate (per contract)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="custom-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2.50"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pl-8"
                />
              </div>
              <Button
                onClick={() => handlePropFirmChange("custom")}
                disabled={saving || !customRate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Current Selection Status */}
        <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-gray-300">Current: </span>
          <Badge variant="secondary" className="bg-blue-600 text-white">
            {availableFirms[currentSelection] || "Unknown"}
          </Badge>
        </div>

        {/* Commission Information */}
        {commissionInfo && (
          <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-medium text-white">Commission Structure</h4>
            <p className="text-sm text-gray-400">
              {commissionInfo.description}
            </p>
            
            {commissionInfo.commission_structures && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(commissionInfo.commission_structures).map(([instrument, rate]) => (
                  <div key={instrument} className="flex justify-between">
                    <span className="text-gray-400">{instrument}:</span>
                    <span className="text-white font-mono">${rate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Commission Impact</p>
            <p>
              Your prop firm selection affects P&L calculations throughout the platform. 
              All analytics will show both gross P&L and net P&L (after commissions).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
