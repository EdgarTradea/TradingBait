

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp, Clock, CheckCircle, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'utils/brain';
import { WeeklyIntentionsResponse } from 'types';
import { motion, AnimatePresence } from 'framer-motion';

export interface Props {
  selectedDate: Date;
}

export function WeeklyIntentions({ selectedDate }: Props) {
  const [intentions, setIntentions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [daysUntilSunday, setDaysUntilSunday] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form state
  const [tradingGoals, setTradingGoals] = useState('');
  const [personalGoals, setPersonalGoals] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadWeeklyIntentions = async () => {
    try {
      setLoading(true);
      const response = await brain.get_current_weekly_intentions();
      
      if (response.ok) {
        const data: WeeklyIntentionsResponse = await response.json();
        
        setIntentions(data.intentions);
        setIsEditable(data.is_editable);
        setDaysUntilSunday(data.days_until_sunday);
        
        // Set form data if intentions exist
        if (data.intentions) {
          setTradingGoals(data.intentions.trading_goals || '');
          setPersonalGoals(data.intentions.personal_goals || '');
        } else {
          setTradingGoals('');
          setPersonalGoals('');
        }
        
        console.log('📅 Weekly intentions loaded:', data);
      } else {
        console.error('Failed to load weekly intentions:', response.status);
        toast.error('Failed to load weekly intentions');
      }
    } catch (error) {
      console.error('Error loading weekly intentions:', error);
      toast.error('Error loading weekly intentions');
    } finally {
      setLoading(false);
    }
  };

  const saveWeeklyIntentions = async () => {
    try {
      setSaving(true);
      
      const response = await brain.create_or_update_current_weekly_intentions({
        trading_goals: tradingGoals,
        personal_goals: personalGoals
      });
      
      if (response.ok) {
        const data: WeeklyIntentionsResponse = await response.json();
        
        if (data.success) {
          setIntentions(data.intentions);
          setIsEditing(false);
          toast.success('Weekly intentions saved successfully!');
        } else {
          toast.error(data.message || 'Failed to save weekly intentions');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save weekly intentions');
      }
    } catch (error) {
      console.error('Error saving weekly intentions:', error);
      toast.error('Error saving weekly intentions');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    if (!isEditable) {
      toast.info(`Weekly intentions can only be edited on Sunday. ${daysUntilSunday} days to go!`);
      return;
    }
    setIsEditing(true);
    setIsExpanded(true); // Auto-expand when editing
  };

  const cancelEditing = () => {
    setIsEditing(false);
    // Reset form to current intentions
    if (intentions) {
      setTradingGoals(intentions.trading_goals || '');
      setPersonalGoals(intentions.personal_goals || '');
    } else {
      setTradingGoals('');
      setPersonalGoals('');
    }
  };

  const getWeekStartDate = () => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday is 0
    const sunday = new Date(date.setDate(diff));
    return sunday.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    loadWeeklyIntentions();
  }, [selectedDate]);

  // Auto-expand if editing or no intentions set
  useEffect(() => {
    if (isEditing || !intentions) {
      setIsExpanded(true);
    }
  }, [isEditing, intentions]);

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-blue-400" />
            Weekly Intentions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-blue-400" />
            Weekly Intentions
          </CardTitle>
          <div className="flex items-center gap-2">
            {intentions && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-1"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            {isEditable ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <Calendar className="h-3 w-3 mr-1" />
                Editable Today
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                <Clock className="h-3 w-3 mr-1" />
                {daysUntilSunday} days to Sunday
              </Badge>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          Week of {getWeekStartDate()} • {isEditable ? 'Set your goals for the week' : 'Review this week\'s goals'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!intentions && !isEditing ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">
              {isEditable 
                ? 'Set your intentions for this week'
                : `No intentions set for this week. Come back on Sunday to set new goals.`
              }
            </p>
            {isEditable && (
              <Button onClick={startEditing} className="bg-blue-600 hover:bg-blue-700">
                <Target className="h-4 w-4 mr-2" />
                Set Weekly Intentions
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Collapsed View - Show both intentions condensed */}
            {!isExpanded && intentions && !isEditing && (
              <div className="space-y-3">
                {/* Trading Goals Condensed */}
                {intentions.trading_goals && (
                  <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-white font-medium text-sm">Trading Goals</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {truncateText(intentions.trading_goals, 80)}
                    </p>
                  </div>
                )}
                
                {/* Personal Goals Condensed */}
                {intentions.personal_goals && (
                  <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-purple-400" />
                      <span className="text-white font-medium text-sm">Personal Goals</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {truncateText(intentions.personal_goals, 80)}
                    </p>
                  </div>
                )}
                
                {/* Edit button for collapsed view */}
                {isEditable && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={startEditing}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Expanded View - Full content */}
            <AnimatePresence>
              {(isExpanded || isEditing) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-6 overflow-hidden"
                >
                  {/* Trading Goals Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <Label className="text-white font-medium">Trading Goals</Label>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={tradingGoals}
                        onChange={(e) => setTradingGoals(e.target.value)}
                        placeholder="What are your trading objectives for this week? (e.g., focus on risk management, stick to trading plan, limit trades per day...)"
                        className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
                      />
                    ) : (
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                        {intentions?.trading_goals ? (
                          <p className="text-gray-200 whitespace-pre-wrap">{intentions.trading_goals}</p>
                        ) : (
                          <p className="text-gray-500 italic">No trading goals set</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Personal Goals Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-400" />
                      <Label className="text-white font-medium">Personal Goals</Label>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={personalGoals}
                        onChange={(e) => setPersonalGoals(e.target.value)}
                        placeholder="What personal development goals support your trading? (e.g., meditation daily, exercise, improve sleep schedule...)"
                        className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
                      />
                    ) : (
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                        {intentions?.personal_goals ? (
                          <p className="text-gray-200 whitespace-pre-wrap">{intentions.personal_goals}</p>
                        ) : (
                          <p className="text-gray-500 italic">No personal goals set</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={saveWeeklyIntentions} 
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Save Intentions
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={cancelEditing}
                          disabled={saving}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      intentions && isEditable && (
                        <Button 
                          onClick={startEditing}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Intentions
                        </Button>
                      )
                    )}
                  </div>

                  {/* Sunday Reset Info */}
                  {!isEditable && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Sunday Reset</span>
                      </div>
                      <p className="text-blue-300 text-sm">
                        Weekly intentions can be edited every Sunday. This creates a fresh start each week and encourages 
                        consistent planning. Come back on Sunday to set new goals for the upcoming week.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  );
}
