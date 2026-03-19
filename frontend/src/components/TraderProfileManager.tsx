import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Settings, TrendingUp, Target, Brain, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import brain from 'utils/brain';
import { toast } from 'sonner';
import TraderAssessmentQuestionnaire from './TraderAssessmentQuestionnaire';

interface TraderProfile {
  user_id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  assessment_data: any;
  ai_analysis: any;
  coaching_recommendations: any;
  development_plan: any;
  profile_version: number;
}

interface Props {
  onProfileUpdate?: (profile: TraderProfile) => void;
}

const TraderProfileManager: React.FC<Props> = ({ onProfileUpdate }) => {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading trader profile...');
      
      const response = await brain.get_trader_profile();
      const profileData = await response.json();
      
      console.log('📊 Profile loaded:', profileData);
      
      setProfile(profileData);
      
      if (profileData && onProfileUpdate) {
        onProfileUpdate(profileData);
      }
      
    } catch (err: any) {
      console.error('❌ Error loading profile:', err);
      if (err.status !== 404) {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAssessmentComplete = async (newProfile: TraderProfile) => {
    setProfile(newProfile);
    setShowAssessment(false);
    
    if (onProfileUpdate) {
      onProfileUpdate(newProfile);
    }
    
    await loadProfile(); // Refresh to get latest data
  };
  
  const handleStartAssessment = () => {
    setShowAssessment(true);
  };
  
  const handleCancelAssessment = () => {
    setShowAssessment(false);
  };
  
  const renderNoProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Trader Profile
        </CardTitle>
        <CardDescription>
          Complete a comprehensive assessment to unlock personalized coaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Personalize Your Coaching Experience</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Take our comprehensive trader assessment to receive AI-powered coaching tailored specifically to your trading style, psychology, and goals.
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <h4 className="font-medium mb-2">Assessment Includes:</h4>
            <div className="text-sm text-left space-y-1">
              <p>• Trading experience and style analysis</p>
              <p>• Psychological profile and risk tolerance</p>
              <p>• Strengths, challenges, and development areas</p>
              <p>• Coaching preferences and communication style</p>
              <p>• Personalized development plan with milestones</p>
            </div>
          </div>
          
          <Button onClick={handleStartAssessment} size="lg" className="w-full max-w-sm">
            <Brain className="w-4 h-4 mr-2" />
            Start Trader Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderProfile = () => {
    if (!profile) return null;
    
    const { assessment_data, ai_analysis, coaching_recommendations, development_plan } = profile;
    
    return (
      <div className="space-y-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Trader Profile
              </div>
              <Badge variant="secondary">
                Version {profile.profile_version}
              </Badge>
            </CardTitle>
            <CardDescription>
              Created {new Date(profile.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trader Type */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trader Classification
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {ai_analysis?.trader_type || 'Analyzing...'}
                </p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Experience:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {assessment_data?.experience?.years_trading === 0 ? 'Less than 1 year' : `${assessment_data?.experience?.years_trading}+ years`}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Style:</span>
                    <span className="text-sm text-muted-foreground ml-2 capitalize">
                      {assessment_data?.experience?.trading_style?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Markets:</span>
                    <span className="text-sm text-muted-foreground ml-2 capitalize">
                      {assessment_data?.experience?.primary_markets?.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Coaching Approach */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Coaching Approach
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Style:</span>
                    <span className="text-sm text-muted-foreground ml-2 capitalize">
                      {assessment_data?.preferences?.communication_style}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Intensity:</span>
                    <span className="text-sm text-muted-foreground ml-2 capitalize">
                      {assessment_data?.preferences?.session_intensity}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Frequency:</span>
                    <span className="text-sm text-muted-foreground ml-2 capitalize">
                      {assessment_data?.development?.preferred_coaching_frequency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Development Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Development Focus
            </CardTitle>
            <CardDescription>
              Your personalized development plan and priority areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {development_plan?.current_focus && (
                <div>
                  <h4 className="font-medium mb-2">Current Focus</h4>
                  <p className="text-sm text-muted-foreground">
                    {development_plan.current_focus}
                  </p>
                </div>
              )}
              
              {development_plan?.priority_areas && development_plan.priority_areas.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Priority Areas</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {development_plan.priority_areas.slice(0, 3).map((area: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{area.area}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Timeline: {area.timeline}
                          </p>
                        </div>
                        <Badge variant={area.priority === 'high' ? 'destructive' : area.priority === 'medium' ? 'default' : 'secondary'}>
                          {area.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {assessment_data?.development?.goals && assessment_data.development.goals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Trading Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {assessment_data.development.goals.slice(0, 6).map((goal: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {goal.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* AI Insights */}
        {ai_analysis?.coaching_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Coaching Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {ai_analysis.coaching_notes}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleStartAssessment}>
                Retake Assessment
              </Button>
              <Button variant="outline" onClick={loadProfile}>
                Refresh Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  if (showAssessment) {
    return (
      <TraderAssessmentQuestionnaire
        onComplete={handleAssessmentComplete}
        onCancel={handleCancelAssessment}
      />
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trader profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="link" onClick={loadProfile} className="ml-2 p-0 h-auto">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return profile ? renderProfile() : renderNoProfile();
};

export default TraderProfileManager;
