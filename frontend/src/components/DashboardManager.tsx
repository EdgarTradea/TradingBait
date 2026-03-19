import React, { useState, useEffect } from 'react';
import { useUserGuardContext } from "app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Plus, Eye, Edit, Trash2, Copy, MoreVertical, ExternalLink, Settings } from "lucide-react";
import { toast } from 'sonner';
import brain from 'utils/brain';
import { mode, Mode } from "app";
import { useStore } from "utils/store";
import { getCardClasses, getTextClasses } from "utils/designSystem";

interface DashboardConfig {
  id: string;
  user_id: string;
  share_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  privacy_settings: {
    show_pnl_amounts: boolean;
    show_account_size: boolean;
    show_specific_symbols: boolean;
    show_trade_count: boolean;
    anonymize_account_names: boolean;
    show_percentages_only: boolean;
  };
  display_settings: {
    enabled_tabs: string[];
    default_tab: string;
    show_ai_insights: boolean;
    custom_title?: string;
    custom_description?: string;
  };
  account_filter?: string;
  symbol_filter?: string;
  date_range_filter?: { from: string; to: string };
  view_count: number;
  created_at: string;
  updated_at: string;
}

type Dashboard = DashboardConfig;

interface CreateDashboardForm {
  title: string;
  description: string;
  privacy_settings: {
    show_pnl_amounts: boolean;
    show_account_size: boolean;
    show_specific_symbols: boolean;
    show_trade_count: boolean;
    anonymize_account_names: boolean;
    show_percentages_only: boolean;
  };
  display_settings: {
    enabled_tabs: string[];
    default_tab: string;
    show_ai_insights: boolean;
    custom_title: string;
    custom_description: string;
  };
  account_filter: string;
  symbol_filter: string;
}

const DEFAULT_FORM: CreateDashboardForm = {
  title: "",
  description: "",
  privacy_settings: {
    show_pnl_amounts: true,
    show_account_size: true,
    show_specific_symbols: true,
    show_trade_count: true,
    anonymize_account_names: false,
    show_percentages_only: false,
  },
  display_settings: {
    enabled_tabs: ["overview", "risk", "equity-simulator", "advanced-analytics"],
    default_tab: "overview",
    show_ai_insights: false,
    custom_title: "",
    custom_description: "",
  },
  account_filter: "all",
  symbol_filter: "",
};

const AVAILABLE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "risk", label: "Risk Analysis" },
  { id: "equity-simulator", label: "Equity Simulator" },
  { id: "advanced-analytics", label: "Advanced Analytics" },
  { id: "data-quality", label: "Data Quality" },
];

export function DashboardManager() {
  const { user } = useUserGuardContext();
  const { evaluations } = useStore();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<DashboardConfig | null>(null);
  const [form, setForm] = useState<CreateDashboardForm>(DEFAULT_FORM);

  // Load user's dashboards
  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await brain.list_dashboards();
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards);
      }
    } catch (error) {
      console.error("Error loading dashboards:", error);
      toast.error("Failed to load dashboards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    if (!form.title.trim()) {
      toast.error("Dashboard title is required");
      return;
    }

    try {
      const response = await brain.create_dashboard(form);
      if (response.ok) {
        toast.success("Dashboard created successfully!");
        setShowCreateDialog(false);
        setForm(DEFAULT_FORM);
        loadDashboards();
      } else {
        toast.error("Failed to create dashboard");
      }
    } catch (error) {
      console.error("Error creating dashboard:", error);
      toast.error("Failed to create dashboard");
    }
  };

  const handleUpdateDashboard = async (dashboardId: string, updates: any) => {
    try {
      const response = await brain.update_dashboard({ dashboardId }, updates);
      if (response.ok) {
        toast.success("Dashboard updated successfully!");
        loadDashboards();
        setEditingDashboard(null);
      } else {
        toast.error("Failed to update dashboard");
      }
    } catch (error) {
      console.error("Error updating dashboard:", error);
      toast.error("Failed to update dashboard");
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) {
      return;
    }

    try {
      const response = await brain.delete_dashboard({ dashboardId });
      if (response.ok) {
        toast.success("Dashboard deleted successfully!");
        loadDashboards();
      } else {
        toast.error("Failed to delete dashboard");
      }
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      toast.error("Failed to delete dashboard");
    }
  };

  const handleViewPublic = (dashboard: Dashboard) => {
    // Use correct domain based on environment
    const baseUrl = mode === Mode.PROD 
      ? 'https://www.tradingbait.com'
      : window.location.origin;
    const url = `${baseUrl}/public-dashboard?share=${dashboard.share_id}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = (dashboard: Dashboard) => {
    // Use correct domain based on environment
    const baseUrl = mode === Mode.PROD 
      ? 'https://www.tradingbait.com'
      : window.location.origin;
    const url = `${baseUrl}/public-dashboard?share=${dashboard.share_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Dashboard link copied to clipboard!');
  };

  const handleTabChange = (tabId: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        display_settings: {
          ...prev.display_settings,
          enabled_tabs: [...prev.display_settings.enabled_tabs, tabId]
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        display_settings: {
          ...prev.display_settings,
          enabled_tabs: prev.display_settings.enabled_tabs.filter(t => t !== tabId)
        }
      }));
    }
  };

  if (loading) {
    return (
      <Card className={getCardClasses()}>
        <CardHeader>
          <CardTitle className={getTextClasses("heading")}>Public Dashboards</CardTitle>
          <CardDescription>Manage your shareable trading dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboards...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getCardClasses()}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={getTextClasses("heading")}>Public Dashboards</CardTitle>
            <CardDescription>Create and manage shareable trading performance dashboards</CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Public Dashboard</DialogTitle>
                <DialogDescription>
                  Create a shareable dashboard to showcase your trading performance publicly
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Basic Information</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Dashboard Title</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="My Trading Performance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your trading strategy or goals"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Privacy Settings</h3>
                  <div className="grid gap-4">
                    {[
                      { key: 'show_pnl_amounts', label: 'Show P&L amounts', description: 'Display actual dollar amounts' },
                      { key: 'show_account_size', label: 'Show account size', description: 'Display account balance information' },
                      { key: 'show_specific_symbols', label: 'Show trading symbols', description: 'Display which instruments are traded' },
                      { key: 'show_trade_count', label: 'Show trade count', description: 'Display number of trades taken' },
                      { key: 'anonymize_account_names', label: 'Anonymize account names', description: 'Hide account identifiers' },
                      { key: 'show_percentages_only', label: 'Show percentages only', description: 'Hide absolute values, show percentages' },
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">{setting.label}</Label>
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        </div>
                        <Switch
                          checked={form.privacy_settings[setting.key as keyof typeof form.privacy_settings]}
                          onCheckedChange={(checked) => setForm(prev => ({
                            ...prev,
                            privacy_settings: {
                              ...prev.privacy_settings,
                              [setting.key]: checked
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Display Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Display Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Enabled Tabs</Label>
                      <p className="text-xs text-muted-foreground mb-3">Choose which sections to display</p>
                      <div className="grid gap-2">
                        {AVAILABLE_TABS.map((tab) => (
                          <div key={tab.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={tab.id}
                              checked={form.display_settings.enabled_tabs.includes(tab.id)}
                              onCheckedChange={(checked) => handleTabChange(tab.id, checked as boolean)}
                            />
                            <Label htmlFor={tab.id} className="text-sm">{tab.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="default_tab">Default Tab</Label>
                      <Select
                        value={form.display_settings.default_tab}
                        onValueChange={(value) => setForm(prev => ({
                          ...prev,
                          display_settings: {
                            ...prev.display_settings,
                            default_tab: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_TABS.filter(tab => form.display_settings.enabled_tabs.includes(tab.id)).map((tab) => (
                            <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Show AI Insights</Label>
                        <p className="text-xs text-muted-foreground">Display AI-powered trading insights</p>
                      </div>
                      <Switch
                        checked={form.display_settings.show_ai_insights}
                        onCheckedChange={(checked) => setForm(prev => ({
                          ...prev,
                          display_settings: {
                            ...prev.display_settings,
                            show_ai_insights: checked
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Filters */}
                <div className="space-y-4">
                  <h3 className="font-medium">Data Filters</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="account_filter">Account Filter</Label>
                      <Select
                        value={form.account_filter}
                        onValueChange={(value) => setForm(prev => ({ ...prev, account_filter: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All accounts</SelectItem>
                          {evaluations.map((evaluation) => (
                            <SelectItem key={evaluation.accountId} value={evaluation.accountId}>
                              {evaluation.firm} - {evaluation.accountId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="symbol_filter">Symbol Filter (Optional)</Label>
                      <Input
                        id="symbol_filter"
                        value={form.symbol_filter}
                        onChange={(e) => setForm(prev => ({ ...prev, symbol_filter: e.target.value }))}
                        placeholder="e.g., EURUSD, GBPUSD (comma-separated)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    setForm(DEFAULT_FORM);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDashboard}>
                    Create Dashboard
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {dashboards.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first public dashboard to share your trading performance
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className={`p-4 rounded-lg border ${dashboard.is_active ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{dashboard.title}</h3>
                      <Badge variant={dashboard.is_active ? "default" : "secondary"}>
                        {dashboard.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {dashboard.description && (
                      <p className="text-sm text-muted-foreground mb-2">{dashboard.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{dashboard.view_count} views</span>
                      <span>Created {new Date(dashboard.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {dashboard.share_id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPublic(dashboard)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(dashboard)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingDashboard(dashboard)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateDashboard(dashboard.id, { is_active: !dashboard.is_active })}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {dashboard.is_active ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
