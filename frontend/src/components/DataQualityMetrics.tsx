import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, FileX, Copy } from "lucide-react";
import { getCardClasses } from "utils/designSystem";

interface QualityAssessment {
  overallScore: number;
  totalTrades: number;
  validTrades: number;
  missingData: number;
  conflicts: number;
  duplicates: number;
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    affectedTrades: number;
    suggestedAction: string;
  }>;
  recommendations: string[];
}

interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
}

interface Props {
  qualityData: QualityAssessment | null;
  issuesByType: Record<string, number>;
  trades: Trade[];
}

export function DataQualityMetrics({ qualityData, issuesByType, trades }: Props) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  if (!qualityData) {
    return (
      <div className="text-center py-8">
        <FileX className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No quality data available. Import trades to see assessment.</p>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quality Score and Progress */}
      <Card className={getCardClasses('default')}>
        <CardHeader>
          <CardTitle className="text-white">Data Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Overall Quality Score</span>
              <span className="text-white font-semibold">{qualityData.overallScore}%</span>
            </div>
            <Progress value={qualityData.overallScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{qualityData.validTrades}</div>
              <div className="text-sm text-gray-400">Valid Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{qualityData.missingData}</div>
              <div className="text-sm text-gray-400">Missing Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{qualityData.conflicts}</div>
              <div className="text-sm text-gray-400">Conflicts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{qualityData.duplicates}</div>
              <div className="text-sm text-gray-400">Duplicates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Breakdown */}
      <Card className={getCardClasses('default')}>
        <CardHeader>
          <CardTitle className="text-white">Issues by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(issuesByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                <Badge variant="secondary" className="bg-red-600">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issues List */}
      <Card className={getCardClasses('default')}>
        <CardHeader>
          <CardTitle className="text-white">Detailed Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {qualityData.issues.map((issue) => (
              <div key={issue.id} className="border border-gray-700 rounded-lg p-4">
                <div 
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{issue.description}</span>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Affects {issue.affectedTrades} trades
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedIssue === issue.id ? '−' : '+'}
                  </span>
                </div>
                
                {expandedIssue === issue.id && (
                  <div className="mt-4 pl-7 space-y-2">
                    <div className="p-3 bg-gray-800 rounded">
                      <h4 className="text-sm font-medium text-white mb-1">Suggested Action:</h4>
                      <p className="text-sm text-gray-300">{issue.suggestedAction}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {qualityData.recommendations.length > 0 && (
        <Card className={getCardClasses('default')}>
          <CardHeader>
            <CardTitle className="text-white">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qualityData.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
