import { useState, useEffect } from "react";
import { useUserGuardContext } from "app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, FileEdit, Trash2, Plus, AlertTriangle, CheckCircle, Search } from "lucide-react";
import brain from "brain";
import { getCardClasses } from "utils/designSystem";

interface AuditEntry {
  action_id: string;
  action_type: string;
  user_id: string;
  affected_trades: string[];
  changes_made: Record<string, any>;
  timestamp: string;
  reason: string;
  user_notes?: string;
}

interface AuditResponse {
  audit_logs: AuditEntry[];
  total_entries: number;
}

export function AuditTrail() {
  const { user } = useUserGuardContext();
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<AuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, actionFilter, searchTerm]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await brain.get_audit_log({ limit: 100 });
      if (response.ok) {
        const data: AuditResponse = await response.json();
        setAuditLogs(data.audit_logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;
    
    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.reason.toLowerCase().includes(term) ||
        log.user_notes?.toLowerCase().includes(term) ||
        log.affected_trades.some(id => id.toLowerCase().includes(term))
      );
    }
    
    setFilteredLogs(filtered);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'edit': return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'add': return <Plus className="h-4 w-4 text-green-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'bulk_edit': return <FileEdit className="h-4 w-4 text-purple-500" />;
      case 'resolve_conflict': return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      case 'import_approval': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'edit': return 'bg-blue-500';
      case 'add': return 'bg-green-500';
      case 'delete': return 'bg-red-500';
      case 'bulk_edit': return 'bg-purple-500';
      case 'resolve_conflict': return 'bg-yellow-500';
      case 'import_approval': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'edit': 'Trade Edit',
      'add': 'Trade Added',
      'delete': 'Trade Deleted',
      'bulk_edit': 'Bulk Edit',
      'resolve_conflict': 'Conflict Resolved',
      'import_approval': 'Import Approved'
    };
    return labels[actionType] || actionType;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatChanges = (changes: Record<string, any>) => {
    return Object.entries(changes).map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    }).join(', ');
  };

  const uniqueActionTypes = [...new Set(auditLogs.map(log => log.action_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Loading audit trail...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
          <p className="text-gray-400">Track all manual interventions and changes</p>
        </div>
        <Button onClick={fetchAuditLogs} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reasons, notes, trade IDs..."
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Action Type</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-600">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {uniqueActionTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getActionLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Results</label>
          <div className="p-2 bg-gray-800 rounded text-center">
            <span className="text-white font-medium">{filteredLogs.length}</span>
            <span className="text-gray-400 ml-1">entries</span>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card className={getCardClasses('default')}>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No audit entries found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((entry) => (
            <Card key={entry.action_id} className={getCardClasses('default')}>
              <CardContent className="p-4">
                <div 
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedEntry(expandedEntry === entry.action_id ? null : entry.action_id)}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {getActionIcon(entry.action_type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getActionColor(entry.action_type)}>
                          {getActionLabel(entry.action_type)}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-white font-medium">{entry.reason}</p>
                      <p className="text-sm text-gray-400">
                        Affected: {entry.affected_trades.length} trade(s)
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedEntry === entry.action_id ? '−' : '+'}
                  </span>
                </div>
                
                {expandedEntry === entry.action_id && (
                  <div className="mt-4 pl-7 space-y-3">
                    {/* Trade IDs */}
                    <div className="p-3 bg-gray-800 rounded">
                      <h4 className="text-sm font-medium text-white mb-1">Affected Trades:</h4>
                      <div className="flex flex-wrap gap-1">
                        {entry.affected_trades.map(tradeId => (
                          <Badge key={tradeId} variant="secondary" className="text-xs">
                            {tradeId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Changes */}
                    <div className="p-3 bg-gray-800 rounded">
                      <h4 className="text-sm font-medium text-white mb-1">Changes Made:</h4>
                      <p className="text-sm text-gray-300 font-mono">
                        {formatChanges(entry.changes_made)}
                      </p>
                    </div>
                    
                    {/* Notes */}
                    {entry.user_notes && (
                      <div className="p-3 bg-gray-800 rounded">
                        <h4 className="text-sm font-medium text-white mb-1">Additional Notes:</h4>
                        <p className="text-sm text-gray-300">{entry.user_notes}</p>
                      </div>
                    )}
                    
                    {/* Action ID for reference */}
                    <div className="text-xs text-gray-500">
                      Action ID: {entry.action_id}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
