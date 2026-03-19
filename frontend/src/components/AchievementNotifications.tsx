import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Trophy, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import { Achievement } from "types";

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  className?: string;
}

interface AchievementToastManagerProps {
  achievements: Achievement[];
  onAchievementViewed: (achievementId: string) => void;
}

export function AchievementNotification({ achievement, onDismiss, className }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300);
  };

  if (!isVisible) return null;

  return (
    <Card className={`fixed top-4 right-4 z-50 w-80 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 shadow-lg animate-in slide-in-from-right duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-sm text-yellow-700 dark:text-yellow-300">Achievement Unlocked!</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{achievement.badge_icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">{achievement.title}</h4>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">{achievement.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-300">
              {achievement.category}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDismiss} className="text-xs">
              Awesome!
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementToastManager({ achievements, onAchievementViewed }: AchievementToastManagerProps) {
  const [visibleAchievements, setVisibleAchievements] = useState<Achievement[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show toast notifications for newly unlocked achievements
    const newlyUnlocked = Array.isArray(achievements) ? achievements.filter(
      a => a.unlocked && !processedIds.has(a.id)
    ) : [];

    if (newlyUnlocked.length > 0) {
      // Show achievements one by one with a delay
      newlyUnlocked.forEach((achievement, index) => {
        setTimeout(() => {
          setVisibleAchievements(prev => [...prev, achievement]);
          setProcessedIds(prev => new Set([...prev, achievement.id]));
          
          // Also show a toast notification
          toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
            description: achievement.description,
            duration: 4000,
          });
        }, index * 2000); // 2 second delay between achievements
      });
    }
  }, [achievements, processedIds]);

  const handleDismiss = (achievementId: string) => {
    setVisibleAchievements(prev => prev.filter(a => a.id !== achievementId));
    onAchievementViewed(achievementId);
  };

  return (
    <>
      {visibleAchievements.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onDismiss={() => handleDismiss(achievement.id)}
          className={`top-${4 + index * 20}`} // Stack notifications
        />
      ))}
    </>
  );
}

// Compact streak summary component for integration
interface StreakSummaryProps {
  streaks?: {
    streak_type: string;
    current_streak: number;
    longest_streak: number;
  }[];
  className?: string;
}

export function StreakSummary({ streaks = [], className }: StreakSummaryProps) {
  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'journal_entry': return <Star className="h-3 w-3" />;
      case 'pre-market': return <Flame className="h-3 w-3" />;
      case 'during-trading': return <Trophy className="h-3 w-3" />;
      case 'post-market': return <Star className="h-3 w-3" />;
      default: return <Flame className="h-3 w-3" />;
    }
  };

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'journal_entry': return 'text-blue-500';
      case 'pre-market': return 'text-orange-500';
      case 'during-trading': return 'text-green-500';
      case 'post-market': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const journalStreak = streaks.find(s => s.streak_type === 'journal_entry');
  
  if (!journalStreak) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getStreakColor('journal_entry')}`}>
        {getStreakIcon('journal_entry')}
        <span className="text-sm font-medium">{journalStreak.current_streak}</span>
      </div>
      <span className="text-xs text-muted-foreground">day streak</span>
      {journalStreak.current_streak > 0 && (
        <Badge variant="outline" className="text-xs">
          🔥 {journalStreak.current_streak}
        </Badge>
      )}
    </div>
  );
}