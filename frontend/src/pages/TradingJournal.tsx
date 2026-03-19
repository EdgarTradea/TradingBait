import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format, isToday, isWithinInterval, subDays } from "date-fns";
import { CalendarDays, Plus, X, Save, Target, TrendingUp, BarChart3, Users, Lightbulb, Heart, Zap, AlertTriangle, Brain, Clock, Sparkles, Flame, Activity } from "lucide-react";
import { ReaderIcon, CalendarIcon, PlusIcon } from "@radix-ui/react-icons";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "utils/cn";
import { useStore } from "utils/store";
import { useUserGuardContext } from "app";
import brain from "brain";
import { toast } from "sonner";
import { ProtectedRoute } from "components/ProtectedRoute";
import { Sidebar } from "components/Sidebar";
import { Header } from "components/Header";
import { OptimizedChart } from "components/OptimizedChart";
import { HabitCompletionChart } from "components/HabitCompletionChart";
import { JournalCoachingPanel } from "components/JournalCoachingPanel";
import { MoodDropdown } from "components/MoodDropdown";
import { WeeklyIntentions } from "components/WeeklyIntentions";
import { Trade } from "utils/types";
import { calculateNetPnl, calculateWinRate, calculateAverageWin, calculateAverageLoss, calculateProfitFactor, calculateSharpeRatio, calculateMaxDrawdown, calculateCalmarRatio, calculateSortino } from "utils/tradingHooks";
import { getMoodInsight, getMoodCategoryColor, getRiskLevelColor, getRiskLevelIcon } from "utils/moodInsights";
import { StreakDashboard } from 'components/StreakDashboard';
import { WeeklyReviewCard, type WeeklyReview } from 'components/WeeklyReviewCard';
import { WeeklyReviewForm, type WeeklyReviewFormData } from 'components/WeeklyReviewForm';
import { WeeklyReviewDetail } from 'components/WeeklyReviewDetail';

const TradingJournalContent = React.memo(() => {
  const { user } = useUserGuardContext();
  const {
    trades,
    fetchTrades,
    isSidebarCollapsed
  } = useStore();

  // Core state - FIXED: Remove duplicate initialization
  const [selectedDate, setSelectedDate] = useState(() => {
    // Initialize with today's date in local timezone to prevent mismatch
    const today = new Date();
    // Create a new date using the local date components to avoid timezone issues
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return localToday;
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  // Journal state with OPTIMIZED initial state
  const [journalEntry, setJournalEntry] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [energyLevel, setEnergyLevel] = useState(5);
  const [marketConditions, setMarketConditions] = useState("");
  const [postMarketConditions, setPostMarketConditions] = useState("");  // NEW: Separate post-market conditions
  const [preMarketNotes, setPreMarketNotes] = useState("");
  const [postMarketNotes, setPostMarketNotes] = useState("");
  const [postMarketMood, setPostMarketMood] = useState("");
  const [dailyIntentions, setDailyIntentions] = useState("");
  const [lessons, setLessons] = useState("");

  // Habit state
  const [customHabits, setCustomHabits] = useState<Array<any>>([]);
  const [habitChecked, setHabitChecked] = useState<{ [key: string]: boolean }>({});
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [showHabitManager, setShowHabitManager] = useState(false);

  // Weekly review state
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [weeklyReviewsLoading, setWeeklyReviewsLoading] = useState(false);
  const [showWeeklyReviewForm, setShowWeeklyReviewForm] = useState(false);
  const [selectedWeeklyReview, setSelectedWeeklyReview] = useState<WeeklyReview | null>(null);
  const [weeklyReviewPage, setWeeklyReviewPage] = useState(1);
  const [weeklyReviewTotalCount, setWeeklyReviewTotalCount] = useState(0);
  const [weeklyReviewDailySummaries, setWeeklyReviewDailySummaries] = useState<any[]>([]);
  const [weeklyReviewChartImages, setWeeklyReviewChartImages] = useState<string[]>([]);

  // Journal entries state
  const [journalEntries, setJournalEntries] = useState<Array<any>>([]);
  const [journalEntriesLoading, setJournalEntriesLoading] = useState(false);

  // Habit management
  const [newHabitText, setNewHabitText] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("pre-market");

  // Warning tab data
  const [tradeMetrics, setTradeMetrics] = useState<any | null>(null);
  const [behavioralInsights, setBehavioralInsights] = useState<any | null>(null);
  const [warningTabLoading, setWarningTabLoading] = useState(false);
  const [warningTabError, setWarningTabError] = useState<string | null>(null);

  // Analytics tab data
  const [habitAnalytics, setHabitAnalytics] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);

  // Habit chart loading state
  const [habitChartLoading, setHabitChartLoading] = useState(false);

  // COMPREHENSIVE FIX: Add ALL missing state variables to eliminate cascading errors
  const [currentDailyIntentions, setCurrentDailyIntentions] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedGoals, setCompletedGoals] = useState<Array<any>>([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [goalProgress, setGoalProgress] = useState(0);
  const [motivationLevel, setMotivationLevel] = useState("neutral");
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [dailyChecklistItems, setDailyChecklistItems] = useState<Array<any>>([]);
  const [tradeConfidence, setTradeConfidence] = useState("moderate");
  const [technicalOutlook, setTechnicalOutlook] = useState("");
  const [hedgeMode, setHedgeMode] = useState(false);
  const [riskToleranceLevel, setRiskToleranceLevel] = useState("medium");
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  // OPTIMIZED: Habit loading function
  const loadUserHabits = useCallback(async () => {
    if (!user || habitsLoaded) return;

    try {
      console.log('📝 loadUserHabits: Starting API call to get_habit_definitions');
      const response = await brain.get_habit_definitions();
      
      if (!response.ok) {
        console.error('❌ loadUserHabits: Failed to fetch habits:', response.status);
        if (response.status === 404) {
          console.log('📝 No habits found, starting with empty list');
          setCustomHabits([]);
          setHabitsLoaded(true);
          return;
        }
        throw new Error(`Failed to fetch habits: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ loadUserHabits: Received habit definitions:', data.habits?.length || 0);
      
      const habits = data.habits || [];
      
      // Transform habits to expected format
      const transformedHabits = habits.map(habit => ({
        id: habit.id,
        label: habit.name,
        text: habit.name,
        category: habit.category || 'pre-market'
      }));
      
      setCustomHabits(transformedHabits);
      setHabitsLoaded(true);
      
    } catch (error) {
      console.error('❌ loadUserHabits: Error:', error);
      setCustomHabits([]);
      setHabitsLoaded(true);
    }
  }, [user, habitsLoaded]);

  // OPTIMIZED: Journal entries loading
  const loadJournalEntries = useCallback(async () => {
    if (!user) return;

    try {
      setJournalEntriesLoading(true);
      console.log('📚 loadJournalEntries: Fetchinging journal entries');
      
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      const response = await brain.get_journal_entries({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ loadJournalEntries: Received entries:', data.entries?.length || 0);
        setJournalEntries(data.entries || []);
      } else {
        console.error('❌ loadJournalEntries: Failed to fetch entries:', response.status);
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('❌ loadJournalEntries: Error:', error);
      setJournalEntries([]);
    } finally {
      setJournalEntriesLoading(false);
    }
  }, [user]);

  // OPTIMIZED: Today's entry loading
  const loadTodaysEntry = useCallback(async () => {
    if (!user || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await brain.get_journal_entry_by_date({ entryDate: dateStr });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`ℹ️ No entry found for ${dateStr}, initializing empty form`);
          
          // Clear form for new entry, but preserve habit structure
          setMood("");
          setMarketConditions("");
          setPreMarketNotes("");
          setPostMarketNotes("");
          setLessons("");
          setDailyIntentions("");
          setPostMarketMood("");
          
          // Initialize habits as unchecked but preserve structure from customHabits
          const emptyHabits = {};
          customHabits.forEach(habit => {
            if (habit && habit.id) {
              emptyHabits[habit.id] = false;
            }
          });
          setHabitChecked(emptyHabits);
          return;
        }
        console.error('Failed to load journal entry:', response.status);
        return;
      }

      const result = await response.json();
      if (!result || !result.entry) return;
      
      const data = result.entry;
      console.log('📥 LOADED ENTRY DATA:', data);

      // Map backend snake_case field names to frontend state
      setMood(data.mood || "");
      setMarketConditions(data.market_outlook || "");  // FIXED: was market_conditions
      setPreMarketNotes(data.pre_market_notes || "");
      setPostMarketNotes(data.post_market_notes || "");
      setLessons(data.lessons_learned || "");  // FIXED: was lessons
      setDailyIntentions(data.daily_intentions || "");
      setPostMarketMood(data.post_market_mood || "");

      // FIXED: Parse habits array correctly (backend returns array, not object)
      const habitsArray = data.habits || [];
      console.log('📋 HABITS ARRAY:', habitsArray);
      
      const habitCheckState = {};
      
      // Convert habits array to checkbox state object
      if (Array.isArray(habitsArray)) {
        habitsArray.forEach(habit => {
          if (habit && habit.id) {
            habitCheckState[habit.id] = habit.completed || false;
          }
        });
      }
      
      // Ensure all custom habits have a state (even if not in saved data)
      customHabits.forEach(habit => {
        if (habit && habit.id && !(habit.id in habitCheckState)) {
          habitCheckState[habit.id] = false;
        }
      });
      
      console.log('✅ HABIT CHECK STATE:', habitCheckState);
      setHabitChecked(habitCheckState);

    } catch (error) {
      console.error('Error loading journal entry:', error);
      toast.error('Failed to load journal entry for selected date');
    }
  }, [user, selectedDate, customHabits]);

  // OPTIMIZED: Analytics data loading
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      const [analyticsResponse, correlationResponse] = await Promise.allSettled([
        brain.get_journal_analytics(),
        brain.get_performance_correlations()
      ]);

      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.ok) {
        const analyticsData = await analyticsResponse.value.json();
        setHabitAnalytics(analyticsData);
      }

      if (correlationResponse.status === 'fulfilled' && correlationResponse.value.ok) {
        const correlationData = await correlationResponse.value.json();
        setCorrelationData(correlationData);
      }
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
    }
  }, [user]);

  // OPTIMIZED: Warnings data loading
  const loadWarningsData = useCallback(async () => {
    if (!user) return;

    try {
      setWarningTabLoading(true);
      setWarningTabError(null);

      const [metricsResponse, insightsResponse] = await Promise.allSettled([
        brain.get_trade_metrics({ userId: user.uid }),
        brain.get_behavioral_insights({ userId: user.uid })
      ]);

      if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
        const metricsData = await metricsResponse.value.json();
        setTradeMetrics(metricsData);
      }

      if (insightsResponse.status === 'fulfilled' && insightsResponse.value.ok) {
        const insightsData = await insightsResponse.value.json();
        setBehavioralInsights(insightsData);
      }
    } catch (error) {
      console.error('❌ Error loading warnings data:', error);
      setWarningTabError('Failed to load warnings data');
    } finally {
      setWarningTabLoading(false);
    }
  }, [user]);

  // Weekly review handlers
  const fetchWeeklyReviews = useCallback(async (page: number = 1) => {
    try {
      setWeeklyReviewsLoading(true);
      const response = await brain.list_weekly_reviews({ page, limit: 10 });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyReviews(data.reviews || []);
        setWeeklyReviewTotalCount(data.total || 0);
        setWeeklyReviewPage(page);
      }
    } catch (error) {
      console.error('Error fetching weekly reviews:', error);
      toast.error('Failed to load weekly reviews');
    } finally {
      setWeeklyReviewsLoading(false);
    }
  }, []);

  const handleCreateWeeklyReview = useCallback(async (reviewData: any) => {
    try {
      const response = await brain.create_weekly_review(reviewData);
      
      if (response.ok) {
        toast.success('Weekly review created successfully!');
        setShowWeeklyReviewForm(false);
        await fetchWeeklyReviews(1);
      } else {
        const error = await response.json().catch(() => null);
        toast.error(error?.detail || 'Failed to create weekly review');
      }
    } catch (error) {
      console.error('Error creating weekly review:', error);
      toast.error('Failed to create weekly review');
    }
  }, [fetchWeeklyReviews]);

  const handleWeeklyReviewClick = useCallback(async (reviewId: string) => {
    try {
      const response = await brain.get_weekly_review({ reviewId });
      
      if (response.ok) {
        const data = await response.json();
        // data is WeeklyReviewDetailResponse, so we need to pass data.review
        setSelectedWeeklyReview(data.review);
        // Also store daily summaries and chart images separately
        setWeeklyReviewDailySummaries(data.daily_summaries || []);
        setWeeklyReviewChartImages(data.chart_images || []);
      } else {
        toast.error('Failed to load weekly review details');
      }
    } catch (error) {
      console.error('Error loading weekly review:', error);
      toast.error('Failed to load weekly review');
    }
  }, []);

  // OPTIMIZED: Single, properly sequenced data loading effect
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        // Load trades data for AI coaching correlations
        fetchTrades(user.uid);

        // FIXED: Load habits first and wait for completion
        await loadUserHabits();

        // FIXED: Load journal entries in parallel, but today's entry AFTER habits are loaded
        await loadJournalEntries();

        // CRITICAL: Load today's entry AFTER habits are loaded to prevent race condition
        await loadTodaysEntry();

      } catch (error) {
        console.error('❌ Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, selectedDate]);

  // Load weekly reviews when weekly-review tab is activated
  useEffect(() => {
    if (activeTab === 'weekly-review' && weeklyReviews.length === 0) {
      fetchWeeklyReviews(1);
    }
  }, [activeTab, fetchWeeklyReviews, weeklyReviews.length]);

  // FIXED: Separate effect for tab-specific data loading to prevent blocking core functionality
  useEffect(() => {
    const loadTabData = async () => {
      if (!user || loading || !habitsLoaded) {
        return;
      }

      // Load additional data for tabs in parallel once core data is ready
      const promises = [];

      if (activeTab === 'analytics') {
        promises.push(loadAnalyticsData());
      }
      
      if (activeTab === 'warnings') {
        promises.push(loadWarningsData());
      }

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    };

    loadTabData();
  }, [user, activeTab, habitsLoaded, loading]);

  // OPTIMIZED: Save journal entry
  const saveJournalEntry = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const habitsData = customHabits.map(h => ({
        id: h.id,
        name: h.name || h.label || h.text || 'Unnamed Habit',
        category: h.category || 'pre-market',
        completed: habitChecked[h.id] ?? false,
        notes: ""
      }));

      console.log('🔍 saveJournalEntry: Raw habit data:', customHabits);
      console.log('🔍 saveJournalEntry: Processed habits:', habitsData);

      const entryData = {
        date: dateStr,
        mood: mood || 'neutral',
        market_outlook: marketConditions || '',
        post_market_outlook: postMarketConditions || '',
        pre_market_notes: preMarketNotes || '',
        post_market_notes: postMarketNotes || '',
        post_market_mood: postMarketMood || '',
        lessons_learned: lessons || '',
        daily_intentions: dailyIntentions || '',
        energy_level: energyLevel,
        goals: '',
        challenges: '',
        wins: '',
        habits: habitsData
      };

      console.log('🔍 saveJournalEntry: Complete entry data being sent:', entryData);

      // Use unified save endpoint - handles both create and update automatically
      console.log('💾 Using unified save endpoint...');
      const response = await brain.save_journal_entry(entryData);

      if (response.ok) {
        toast.success('Journal entry saved successfully!');
        await loadJournalEntries();
        // REMOVED: await loadTodaysEntry(); // This was causing habit states to revert
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('🔍 saveJournalEntry: API error response:', errorText);
        throw new Error('Failed to save journal entry');
      }
    } catch (error) {
      console.error('❌ Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }

  }, [selectedDate, customHabits, habitChecked, mood, energyLevel, marketConditions, preMarketNotes, postMarketNotes, postMarketMood, lessons, dailyIntentions]);

  // OPTIMIZED: Update habits with proper backend sync
  const updateHabits = useCallback(async () => {
    if (!selectedDate || !user) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Create habits array with current completion states
      const habitsToSave = customHabits.map(habit => ({
        id: habit.id,
        name: habit.name || habit.label || habit.text || 'Unnamed Habit',
        category: habit.category || 'pre-market',
        completed: habitChecked[habit.id] ?? false,
        notes: ""
      }));

      // Use unified save endpoint - just the habit data with current form state
      console.log('🔄 updateHabits: Using unified save endpoint...');
      const entryData = {
        date: dateStr,
        habits: habitsToSave
      };

      const response = await brain.save_journal_entry(entryData);
      
      if (response.ok) {
        console.log('🔄 updateHabits: Successfully saved habits via unified endpoint');
        // REMOVED: await loadTodaysEntry(); // This was causing habit states to revert
      } else {
        throw new Error('Failed to save journal entry');
      }
    } catch (error) {
      console.error('❌ updateHabits: Error updating habits:', error);
      // Don't show error toast for habit updates as it can be noisy
      throw error; // Re-throw to handle in UI
    }
  }, [selectedDate, customHabits, habitChecked, mood, energyLevel, marketConditions, preMarketNotes, postMarketNotes, postMarketMood, lessons, dailyIntentions]);

  // FIXED: Direct habit save function that works independently
  const saveHabitState = useCallback(async (habitId, newState) => {
    if (!selectedDate || !user) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Get current journal entry to preserve existing habits structure
      const currentResponse = await brain.get_journal_entry_by_date({ entryDate: dateStr });
      let existingHabits = [];
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        existingHabits = currentData.entry?.habits || [];
      }

      // Update the specific habit state
      const updatedHabits = existingHabits.map(habit => 
        habit.id === habitId 
          ? { ...habit, completed: newState }
          : habit
      );

      // Save only the habits update
      const entryData = {
        date: dateStr,
        habits: updatedHabits
      };

      const response = await brain.save_journal_entry(entryData);
      
      if (response.ok) {
        console.log('✅ Habit saved successfully:', habitId, newState);
        toast.success('Habit updated!');
      } else {
        throw new Error('Failed to save habit');
      }
    } catch (error) {
      console.error('❌ Habit save failed:', error);
      toast.error('Failed to save habit');
      // Revert the UI state on error
      setHabitChecked(prev => ({ ...prev, [habitId]: !newState }));
    }
  }, [selectedDate, user]);

  // FIXED: Handle habit checkbox changes with immediate save
  const toggleHabit = useCallback(async (habitId) => {
    try {
      const newState = !habitChecked[habitId];
      
      // Update UI immediately (optimistic update)
      setHabitChecked(prev => ({ ...prev, [habitId]: newState }));
      
      // Save to backend immediately
      await saveHabitState(habitId, newState);
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast.error('Failed to update habit');
    }
  }, [habitChecked, saveHabitState]);

  const handleHabitChange = useCallback(async (habitId, checked) => {
    await toggleHabit(habitId);
  }, [toggleHabit]);

  // Handle adding new custom habits
  const handleAddHabit = useCallback(async () => {
    if (!newHabitText.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    try {
      console.log('🔄 Adding new habit:', { name: newHabitText, category: newHabitCategory });

      const response = await brain.create_habit_definition({
        name: newHabitText.trim(),
        category: newHabitCategory,
        description: null
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Habit created successfully:', data);

        // Clear input fields
        setNewHabitText('');

        // Refresh habits list to show the new habit
        await loadUserHabits();

        // Close habit manager (optional UX improvement)
        setShowHabitManager(false);

        toast.success('Habit added successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Failed to create habit:', errorData);
        toast.error(errorData?.detail || 'Failed to add habit');
      }
    } catch (error) {
      console.error('❌ Error adding habit:', error.message || error.toString());
      toast.error('Failed to add habit. Please try again.');
    }
  }, [newHabitText, newHabitCategory, loadUserHabits]);

  // Helper functions for habit management
  const getHabitsByCategory = useCallback((category) => {
    return customHabits.filter(habit => habit && habit.id && habit.category === category);
  }, [customHabits]);

  const getCompletionPercentage = useCallback((habits) => {
    if (!habits || habits.length === 0) return 0;
    const completed = habits.filter(h => habitChecked[h.id] ?? false).length;
    return Math.round((completed / habits.length) * 100);
  }, [habitChecked]);

  // Handle deleting custom habits
  const handleDeleteHabit = useCallback(async (habitId, habitName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the habit "${habitName}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      console.log('🗑️ Deleting habit:', { id: habitId, name: habitName });

      const response = await brain.delete_habit_definition({ habitId });

      if (response.ok) {
        console.log('✅ Habit deleted successfully');

        // Refresh habits list to remove the deleted habit
        await loadUserHabits();

        toast.success('Habit deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Failed to delete habit:', errorData);
        toast.error(errorData?.detail || 'Failed to delete habit');
      }
    } catch (error) {
      console.error('❌ Error deleting habit:', error.message || error.toString());
      toast.error('Failed to delete habit. Please try again.');
    }
  }, [loadUserHabits]);

  // Function to calculate recent trading activity from actual trade data
  const calculateRecentTradingActivity = useCallback(async (trades) => {
    try {
      console.log('📈 Calculating recent trading activity for', trades.length, 'total trades...');

      // Filter trades to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Filter trades that were opened or closed in the last 30 days
      const recentTrades = trades.filter(trade => {
        if (!trade.openTime && !trade.closeTime) return false;

        const openDate = trade.openTime ? new Date(trade.openTime) : null;
        const closeDate = trade.closeTime ? new Date(trade.closeTime) : null;

        // Include trade if either open or close time is within last 30 days
        return (openDate && openDate >= thirtyDaysAgo) || (closeDate && closeDate >= thirtyDaysAgo);
      });

      console.log('📈 Found', recentTrades.length, 'trades in last 30 days');

      if (recentTrades.length === 0) {
        return {
          period: '30 days',
          totalTrades: 0,
          tradingDays: 0,
          avgTradesPerDay: 0,
          maxTradesInDay: 0,
          tradingFrequency: 'none',
          lastTradingDay: null,
          analysis: 'No trading activity in the last 30 days'
        };
      }

      // Group trades by date to calculate active trading days
      const tradesByDate = new Map();

      recentTrades.forEach(trade => {
        // Use close time if available, otherwise open time
        const tradeDate = trade.closeTime ? new Date(trade.closeTime) : new Date(trade.openTime);
        const dateStr = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!tradesByDate.has(dateStr)) {
          tradesByDate.set(dateStr, 0);
        }
        tradesByDate.set(dateStr, tradesByDate.get(dateStr) + 1);
      });

      // Calculate metrics
      const tradingDays = tradesByDate.size;
      const avgTradesPerDay = tradingDays > 0 ? recentTrades.length / tradingDays : 0;
      const maxTradesInDay = Math.max(...Array.from(tradesByDate.values()));

      // Get last trading day
      const sortedDates = Array.from(tradesByDate.keys()).sort();
      const lastTradingDay = sortedDates[sortedDates.length - 1];

      // Determine trading frequency category
      let tradingFrequency = 'low';
      let analysis = `Traded on ${tradingDays} days in the last 30 days`;

      if (avgTradesPerDay > 15) {
        tradingFrequency = 'excessive';
        analysis += '. Extremely high frequency - consider reducing trade volume';
      } else if (avgTradesPerDay > 8) {
        tradingFrequency = 'high';
        analysis += '. High frequency trading detected - monitor for overtrading';
      } else if (avgTradesPerDay > 3) {
        tradingFrequency = 'moderate';
        analysis += '. Moderate trading frequency';
      } else {
        tradingFrequency = 'low';
        analysis += '. Conservative trading frequency';
      }

      if (maxTradesInDay > 10) {
        analysis += `. Warning: Peak of ${maxTradesInDay} trades in a single day detected`;
      }

      return {
        period: '30 days',
        totalTrades: recentTrades.length,
        tradingDays,
        avgTradesPerDay: Math.round(avgTradesPerDay * 100) / 100, // Round to 2 decimal places
        maxTradesInDay,
        tradingFrequency,
        lastTradingDay,
        analysis
      };
    } catch (error) {
      console.error('❌ Error calculating recent trading activity:', error);
      return {
        period: '30 days',
        totalTrades: 0,
        tradingDays: 0,
        avgTradesPerDay: 0,
        maxTradesInDay: 0,
        tradingFrequency: 'unknown',
        lastTradingDay: null,
        analysis: 'Error calculating trading activity: ' + (error.message || error.toString())
      };
    }
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => setActiveTab(value);

  if (loading && customHabits.length === 0) {
    return (
      <div className={`flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-950 via-slate-990 to-gray-950 text-gray-100 ${isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
        }`}>
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center glassmorphic-card p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-300 font-medium">Loading Trading Journal...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-990 via-slate-900 to-gray-990 text-gray-100 ${isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
      }`}>
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-100 via-emerald-400 to-gray-100 bg-clip-text text-transparent flex items-center gap-3">
                <ReaderIcon className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                Trading Journal & Habits
              </h1>
              <p className="text-gray-400 text-sm sm:text-base font-medium">
                Track your trading journey, habits, and performance insights.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="flex w-full overflow-x-auto gap-1 p-1 bg-muted/30 rounded-lg">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
                Overview
              </TabsTrigger>
              <TabsTrigger value="coach" className="text-xs sm:text-sm px-1 sm:px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/80 border border-purple-500/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/40 data-[state=active]:to-blue-500/40">
                <Sparkles className="h-4 w-4 mr-1 text-purple-400" />
                AI Coach
              </TabsTrigger>
              <TabsTrigger value="habits" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                Habits
              </TabsTrigger>
              <TabsTrigger value="journal" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
                Journal
              </TabsTrigger>
              <TabsTrigger value="weekly-review" className="text-xs sm:text-sm px-2 sm:px-3 py-2 bg-gradient-to-r from-green-500/20 to-yellow-500/20 border border-green-500/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/40 data-[state=active]:to-yellow-500/40">
                <CalendarDays className="h-4 w-4 mr-1 text-green-400" />
                Weekly Review
              </TabsTrigger>
              {/* <TabsTrigger value="warning" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Warning
              </TabsTrigger> */}
              {/* <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Calendar */}
                <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-bold text-gray-100">
                      <CalendarIcon className="h-5 w-5 text-emerald-400" />
                      Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border-0 w-full text-gray-100 [&_.rdp-table]:w-full [&_.rdp-cell]:p-1 [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:text-sm [&_.rdp-day_selected]:bg-emerald-500 [&_.rdp-day_selected]:text-white [&_.rdp-day_today]:bg-gray-700 [&_.rdp-day_today]:text-emerald-400 [&_.rdp-head_cell]:text-gray-400 [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-xs [&_.rdp-nav_button]:text-gray-400 [&_.rdp-nav_button:hover]:bg-gray-700 [&_.rdp-caption]:text-gray-200 [&_.rdd-caption]:font-medium [&_.rdp-day:hover]:bg-gray-700 [&_.rdp-day_outside]:text-gray-600"
                      showOutsideDays={true}
                      fixedWeekWeek
                    />
                  </CardContent>
                </Card>

                {/* Today's Habits Summary - FIXED: Updates immediately */}
                <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="font-bold text-gray-100">Today's Habits</CardTitle>
                    <CardDescription className="text-gray-400">
                      {selectedDate.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!habitsLoaded ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-1"></div>
                          <span className="text-sm text-muted-foreground">Loading habits...</span>
                        </div>
                      </div>
                    ) : customHabits.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-1">No habits yet</p>
                        <Button onClick={() => setActiveTab("habits")} size="sm">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Your First Habit
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Pre-Market</span>
                            <Badge variant="outline">
                              {getCompletionPercentage(getHabitsByCategory('pre-market'))}%
                            </Badge>
                          </div>
                          <Progress
                            value={getCompletionPercentage(getHabitsByCategory('pre-market'))}
                            className="h-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">During Trading</span>
                            <Badge variant="outline">
                              {getCompletionPercentage(getHabitsByCategory('during-trading'))}%
                            </Badge>
                          </div>
                          <Progress
                            value={getCompletionPercentage(getHabitsByCategory('during-trading'))}
                            className="h-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Post-Market</span>
                            <Badge variant="outline">
                              {getCompletionPercentage(getHabitsByCategory('post-market'))}%
                            </Badge>
                          </div>
                          <Progress
                            value={getCompletionPercentage(getHabitsByCategory('post-market'))}
                            className="h-1"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Journal Entries */}
                <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="font-bold text-gray-100">Journal Entries</CardTitle>
                    <CardDescription className="text-gray-400">Your recent trading insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                      {journalEntriesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-1"></div>
                            <span className="text-sm text-muted-foreground">Loading journal entries...</span>
                          </div>
                        </div>
                      ) : journalEntries.length > 0 ? (
                        journalEntries.slice(0, 5).map((entry, index) => (
                          <div key={index} className="p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg space-y-2 hover:bg-gray-700/30 transition-color-color">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm text-white">{new Date(entry.date).toLocaleDateString()}</span>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">{entry.mood || 'No mood'}</Badge>
                            </div>
                            {entry.lessons && (
                              <div className="text-sm">
                                <span className="font-medium text-white">Lesson:</span>
                                <p className="mt-1 text-gray-400 text-xs">
                                  {entry.lessons.length > 100 ? entry.lessons.substring(0, 100) + '...' : entry.lessons}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <p>No journal entries yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Habit Completion Chart - Full width below the grid */}
              <div className="mt-6">
                <HabitCompletionChart 
                  className="w-full"
                  isLoading={habitChartLoading || journalEntriesLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="coach" className="space-y-6">
              {/* AI Journal Coaching Panel */}
              <JournalCoachingPanel
                selectedDate={selectedDate}
                habits={customHabits}
                habitChecked={habitChecked}
                journalEntry={{
                  mood,
                  marketConditions,
                  postMarketConditions,
                  preMarketNotes,
                  postMarketNotes,
                  lessons
                }}
                onHabitToggle={handleHabitChange}
                journalEntries={journalEntries}
                trades={trades}
              />
            </TabsContent>

            <TabsContent value="habits" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Daily Habits Tracker</h3>
                  <p className="text-sm text-muted-foreground">Track your trading routine and discipline</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowHabitManager(!showHabitManager)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Manage Habits
                </Button>
              </div>

              {/* Habit Manager */}
              {showHabitManager && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Manage Your Habits</CardTitle>
                    <CardDescription>Add custom habits to track</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Add new habit..."
                        value={newHabitText}
                        onChange={(e) => setNewHabitText(e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex gap-2">
                        <Select value={newHabitCategory} onValueChange={setNewHabitCategory}>
                          <SelectTrigger className="w-full sm:w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre-market">Pre-Market</SelectItem>
                            <SelectItem value="during-trading">During Trading</SelectItem>
                            <SelectItem value="post-market">Post-Market</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="shrink-0" onClick={handleAddHabit}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Habit Lists */}
              <div className="grid gap-6">
                {['pre-market', 'during-trading', 'post-market'].map(category => (
                  <Card key={category} className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        <Badge variant="outline">
                          {getCompletionPercentage(getHabitsByCategory(category))}% Complete
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getHabitsByCategory(category).map((habit) => (
                          <div key={habit.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                            <Checkbox
                              id={`habit-${habit.id}`}
                              checked={habitChecked[habit.id] ?? false}
                              onCheckedChange={(checked) => handleHabitChange(habit.id, checked)}
                            />
                            <label
                              htmlFor={`habit-${habit.id}`}
                              className={`text-sm flex-1 cursor-pointer ${habitChecked[habit.id] ? 'line-through text-muted-foreground' : ''
                                }`}
                            >
                              {habit.label}
                            </label>

                            {/* Contextual coaching indicators */}
                            <div className="flex items-center gap-1">
                              {/* Streak indicator */}
                              {(() => {
                                // Calculate habit streak from recent entries
                                const recentEntries = journalEntries.slice(-7).reverse();
                                let streak = 0;
                                for (const entry of recentEntries) {
                                  const habitInEntry = entry.habits?.find((h: any) => h.name === habit.label);
                                  if (habitInEntry?.completed) {
                                    streak++;
                                  } else {
                                    break;
                                  }
                                }

                                if (streak >= 3) {
                                  return (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full">
                                      <Flame className="h-3 w-3 text-orange-400" />
                                      <span className="text-xs text-orange-300">{streak}d</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Celebration for completion */}
                              {habitChecked[habit.id] && (
                                <div className="animate-pulse">
                                  <Sparkles className="h-4 w-4 text-green-400" />
                                </div>
                              )}

                              {/* Warning for missed habit */}
                              {!habitChecked[habit.id] && isToday(selectedDate) && (() => {
                                const recentEntries = journalEntries.slice(-3);
                                const missedRecently = recentEntries.filter(entry => {
                                  const habitInEntry = entry.habits?.find((h: any) => h.name === habit.label);
                                  return !habitInEntry?.completed;
                                }).length >= 2;

                                if (missedRecently) {
                                  return (
                                    <AlertTriangle className="h-3 w-3 text-yellow-400 opacity-60" />
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Delete button - only show when managing habits */}
                            {showHabitManager && (
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteHabit(habit.id, habit.label)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {getHabitsByCategory(category).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No habits in this category yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="journal" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Journal Entry for {selectedDate.toLocaleDateString()}</CardTitle>
                  <CardDescription className="text-gray-400">
                    Record your trading thoughts, lessons, and market observations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Intentions</label>
                    <Textarea
                      placeholder="What is your mindset and approach for today's trading? (e.g., 'Stay patient and disciplined', 'Focus on quality setups')..."
                      value={dailyIntentions}
                      onChange={(e) => setDailyIntentions(e.target.value)}
                      className="min-h-[80px] border-blue-500/20 focus:border-blue-500/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set your daily trading intentions - focus on mindset and approach rather than specific targets
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mood">Pre-Market Mood</Label>
                      <MoodDropdown
                        value={mood}
                        onChange={setMood}
                        placeholder="How are you feeling before market open?"
                        className="w-full"
                      />

                      {/* Enhanced coaching insights based on mood */}
                      {mood && (() => {
                        const moodInsight = getMoodInsight(mood);
                        if (!moodInsight) return null;
                        
                        return (
                          <div className={`mt-2 p-3 rounded-lg border text-xs ${getMoodCategoryColor(moodInsight.category)}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium">{moodInsight.title}</span>
                              <span className="text-xs opacity-70">
                                {getRiskLevelIcon(moodInsight.riskLevel)} {moodInsight.riskLevel}
                              </span>
                            </div>
                            <p className="opacity-90 mb-2 leading-relaxed">{moodInsight.message}</p>
                            
                            {/* Compact actionable advice */}
                            <div className="space-y-1">
                              <div className="font-medium opacity-80">Key Actions:</div>
                              <ul className="space-y-0.5 opacity-75">
                                {moodInsight.actionableAdvice.slice(0, 2).map((advice, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="mt-1">•</span>
                                    <span>{advice}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Market Conditions</label>
                      <Select value={marketConditions}onValueChange={setMarketConditions}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select market conditions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bullish">Bullish</SelectItem>
                          <SelectItem value="bearish">Bearish</SelectItem>
                          <SelectItem value="sideways">Sideways</SelectItem>
                          <SelectItem value="volatile">Volatile</SelectItem>
                          <SelectItem value="low-volume">Low Volume</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pre-Market Notes</label>
                    <Textarea
                      placeholder="What did you prepare before market open?"
                      value={preMarketNotes}
                      onChange={(e) => setPreMarketNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Post-Market Section - Reorganized to mirror pre-market layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Post-Market Mood</label>
                      <MoodDropdown
                        value={postMarketMood}
                        onChange={setPostMarketMood}
                        placeholder="How are you feeling after today's trading session?"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Track your emotional state to identify patterns and improve decision-making
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Post-Market Conditions</label>
                      <Select value={postMarketConditions} onValueChange={setPostMarketConditions}>
                        <SelectTrigger>
                          <SelectValue placeholder="How did market conditions evolve?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bullish">Bullish</SelectItem>
                          <SelectItem value="bearish">Bearish</SelectItem>
                          <SelectItem value="sideways">Sideways</SelectItem>
                          <SelectItem value="volatile">Volatile</SelectItem>
                          <SelectItem value="low-volume">Low Volume</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Post-Market Notes</label>
                    <Textarea
                      placeholder="How did the trading session go?"
                      value={postMarketNotes}
                      onChange={(e) => setPostMarketNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lessons Learned</label>
                    <Textarea
                      placeholder="What did you learn today?"
                      value={lessons}
                      onChange={(e) => setLessons(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button onClick={saveJournalEntry} disabled={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Journal Entry'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Weekly Intentions Section */}
              <WeeklyIntentions selectedDate={selectedDate} />
            </TabsContent>

            <TabsContent value="weekly-review" className="space-y-6">
              {/* Detail View */}
              {selectedWeeklyReview ? (
                <WeeklyReviewDetail
                  review={selectedWeeklyReview}
                  dailySummaries={weeklyReviewDailySummaries}
                  chartImages={weeklyReviewChartImages}
                  onBack={() => setSelectedWeeklyReview(null)}
                />
              ) : showWeeklyReviewForm ? (
                /* Form View */
                <WeeklyReviewForm
                  onSubmit={handleCreateWeeklyReview}
                  onCancel={() => setShowWeeklyReviewForm(false)}
                />
              ) : (
                /* List View */
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Weekly Reviews</h3>
                      <p className="text-sm text-gray-400 mt-1">Reflect on your weekly performance and set goals</p>
                    </div>
                    <Button
                      onClick={() => setShowWeeklyReviewForm(true)}
                      className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Review
                    </Button>
                  </div>

                  {/* Reviews List */}
                  {weeklyReviewsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <span className="text-sm text-muted-foreground">Loading weekly reviews...</span>
                      </div>
                    </div>
                  ) : weeklyReviews.length === 0 ? (
                    <Card className="glassmorphic-card bg-gray-900/80 border-gray-700/50">
                      <CardContent className="py-12">
                        <div className="text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="rounded-full bg-gradient-to-br from-green-500/20 to-yellow-500/20 p-6">
                              <CalendarDays className="h-12 w-12 text-green-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Weekly Reviews Yet</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                              Start reflecting on your weekly trading performance to identify patterns and improve your edge.
                            </p>
                            <Button
                              onClick={() => setShowWeeklyReviewForm(true)}
                              className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-white"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Weekly Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weeklyReviews.map((review) => (
                          <WeeklyReviewCard
                            key={review.review_id}
                            review={review}
                            onClick={() => handleWeeklyReviewClick(review.review_id)}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      {weeklyReviewTotalCount > 10 && (
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchWeeklyReviews(weeklyReviewPage - 1)}
                            disabled={weeklyReviewPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-4 text-sm text-gray-400">
                            Page {weeklyReviewPage} of {Math.ceil(weeklyReviewTotalCount / 10)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchWeeklyReviews(weeklyReviewPage + 1)}
                            disabled={weeklyReviewPage >= Math.ceil(weeklyReviewTotalCount / 10)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="warning" className="space-y-6">
              {warningTabError && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error Loading Data</AlertTitle>
                  <AlertDescription>
                    {warningTabError}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={loadWarningTabData}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6">
                {/* Behavioral Insights */}
                <Card className="bg-gray-f00/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5" />
                      Behavioral Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {warningTabLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                        Loading behavioral insights...
                      </div>
                    ) : behavioralInsights ? (
                      <div className="space-y-4">
                        {/* Consistency Score */}
                        {behavioralInsights.consistency_score !== undefined && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Journal Consistency Score</span>
                              <span className="text-2xl font-bold text-blue-400">
                                {behavioralInsights.consistency_score}%
                              </span>
                            </div>
                            <div className="mt-1 w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${behavioralInsights.consistency_score}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Streak Information */}
                        {behavioralInsights.streak_data && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">
                                {behavioralInsights.streak_data.current_streak}
                              </div>
                              <div className="text-sm text-muted-foreground">Current Streak</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400">
                                {behavioralInsights.streak_data.longest_streak}
                              </div>
                              <div className="text-sm text-muted-foreground">Longest Streak</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-400">
                                {behavioralInsights.streak_data.total_entries}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Entries</div>
                            </div>
                          </div>
                        )}

                        {/* Behavioral Insights */}
                        {behavioralInsights.insights && behavioralInsights.insights.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Insights & Recommendations</h4>
                            {behavioralInsights.insights.map((insight, index) => (
                              <Alert key={index} className={`${insight.type === 'positive' ? 'border-green-500/20 bg-green-500/5' :
                                  insight.type === 'warning' ? 'border-orange-500/20 bg-orange-500/5' :
                                    insight.type === 'recommendation' ? 'border-blue-500/20 bg-blue-500/5' :
                                      'border-gray-500/20 bg-gray-500/5'
                                }`}>
                                <TrendingUp className="h-4 w-4" />
                                <AlertTitle>{insight.title}</AlertTitle>
                                <AlertDescription>
                                  {insight.message}
                                  {insight.confidence && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                                    </div>
                                  )}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No behavioral insights available yet. Continue journaling to build insights.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No behavioral insights available yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab - Hidden for now */}
          </Tabs>
        </main>
      </div>
    </div>
  );
});

export default function Tradingjournal() {
  return (
    <ProtectedRoute>
      <TradingJournalContent />
    </ProtectedRoute>
  );
}
