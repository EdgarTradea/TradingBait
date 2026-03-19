import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import brain from "brain";
import { getCardClasses } from "utils/designSystem";

interface ConflictData {
  id: string;
  tradeId: string;
  field: string;
  brokerValue: any;
  parsedValue: any;
  suggestedResolution: string;
}

interface Props {
  conflicts: ConflictData[];
  onConflictResolved: () => void;
}

export function ConflictResolver({ conflicts, onConflictResolved }: Props) {
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const [bulkResolving, setBulkResolving] = useState(false);

  const handleResolutionChange = (conflictId: string, resolution: string) => {
    setSelectedResolutions(prev => ({
      ...prev,
      [conflictId]: resolution
    }));
  };

  const resolveConflict = async (conflictId: string) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    const resolution = selectedResolutions[conflictId] || conflict?.suggestedResolution;
    
    if (!conflict || !resolution) return;

    setResolving(conflictId);
    try {
      await brain.resolve_conflict({
        conflict_id: conflictId,
        resolution_action: resolution,
        reason: "Manual conflict resolution"
      });
      onConflictResolved();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  const resolveBulkConflicts = async () => {
    setBulkResolving(true);
    try {
      for (const conflict of conflicts) {
        const resolution = selectedResolutions[conflict.id] || conflict.suggestedResolution;
        await brain.resolve_conflict({
          conflict_id: conflict.id,
          resolution_action: resolution,
          apply_to_similar: true,
          reason: "Bulk conflict resolution"
        });
      }
      onConflictResolved();
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    } finally {
      setBulkResolving(false);
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      'closePrice': 'Close Price',
      'openPrice': 'Open Price',
      'quantity': 'Quantity',
      'closeTime': 'Close Time',
      'openTime': 'Open Time',
      'commission': 'Commission',
      'swap': 'Swap'
    };
    return fieldNames[field] || field;
  };

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Conflicts Found</h3>
        <p className="text-gray-400">All trade data appears to be consistent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Data Conflicts</h3>
          <p className="text-gray-400">{conflicts.length} conflicts requiring resolution</p>
        </div>
        <Button 
          onClick={resolveBulkConflicts}
          disabled={bulkResolving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {bulkResolving ? 'Resolving...' : 'Resolve All'}
        </Button>
      </div>

      <div className="space-y-4">
        {conflicts.map((conflict) => {
          const resolution = selectedResolutions[conflict.id] || conflict.suggestedResolution;
          
          return (
            <Card key={conflict.id} className={getCardClasses('default')}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Field Mismatch: {getFieldDisplayName(conflict.field)}
                    </CardTitle>
                    <p className="text-gray-400 text-sm mt-1">Trade ID: {conflict.tradeId}</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600">
                    Conflict
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Broker Value */}
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-green-400 mb-1">Broker Value</h4>
                    <p className="text-white font-mono">{formatValue(conflict.brokerValue)}</p>
                  </div>
                  
                  {/* Parsed Value */}
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-red-400 mb-1">Parsed Value</h4>
                    <p className="text-white font-mono">{formatValue(conflict.parsedValue)}</p>
                  </div>
                  
                  {/* Resolution */}
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-400 mb-1">Resolution</h4>
                    <Select 
                      value={resolution} 
                      onValueChange={(value) => handleResolutionChange(conflict.id, value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="use_broker">Use Broker Value</SelectItem>
                        <SelectItem value="use_parsed">Use Parsed Value</SelectItem>
                        <SelectItem value="use_custom">Use Custom Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-gray-400">
                    Suggested: <span className="text-blue-400">{conflict.suggestedResolution.replace('_', ' ')}</span>
                  </div>
                  <Button 
                    onClick={() => resolveConflict(conflict.id)}
                    disabled={resolving === conflict.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {resolving === conflict.id ? (
                      'Resolving...'
                    ) : (
                      <>
                        Resolve <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
