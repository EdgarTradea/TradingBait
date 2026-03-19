import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import brain from 'utils/brain';

// Predefined professional trading moods
const PREDEFINED_MOODS = [
  // Positive moods
  { id: 'confident', name: 'Confident', category: 'positive', color: '#10b981', icon: '💪' },
  { id: 'disciplined', name: 'Disciplined', category: 'positive', color: '#3b82f6', icon: '🎯' },
  { id: 'focused', name: 'Focused', category: 'positive', color: '#8b5cf6', icon: '🔍' },
  { id: 'satisfied', name: 'Satisfied', category: 'positive', color: '#06b6d4', icon: '😌' },
  { id: 'in_zone', name: 'In the Zone', category: 'positive', color: '#84cc16', icon: '⚡' },
  { id: 'patient', name: 'Patient', category: 'positive', color: '#14b8a6', icon: '🧘' },
  
  // Negative moods
  { id: 'frustrated', name: 'Frustrated', category: 'negative', color: '#ef4444', icon: '😤' },
  { id: 'anxious', name: 'Anxious', category: 'negative', color: '#f59e0b', icon: '😰' },
  { id: 'regretful', name: 'Regretful', category: 'negative', color: '#dc2626', icon: '😔' },
  { id: 'overwhelmed', name: 'Overwhelmed', category: 'negative', color: '#7c2d12', icon: '🤯' },
  { id: 'fomo', name: 'FOMO', category: 'negative', color: '#be185d', icon: '😵' },
  { id: 'revenge_trading', name: 'Revenge Trading', category: 'negative', color: '#991b1b', icon: '😡' },
  { id: 'impatient', name: 'Impatient', category: 'negative', color: '#ea580c', icon: '😫' },
  
  // Neutral moods
  { id: 'neutral', name: 'Neutral', category: 'neutral', color: '#6b7280', icon: '😐' },
  { id: 'cautious', name: 'Cautious', category: 'neutral', color: '#475569', icon: '🤔' },
  { id: 'analytical', name: 'Analytical', category: 'neutral', color: '#1e40af', icon: '📊' },
];

interface MoodDropdownProps {
  value?: string;
  onChange: (mood: string) => void;
  placeholder?: string;
  className?: string;
}

interface CustomMood {
  id: string;
  name: string;
  category: string;
  color?: string;
  icon?: string;
  usage_count: number;
  user_id?: string;
}

export function MoodDropdown({ value, onChange, placeholder = "Select your post-market mood...", className }: MoodDropdownProps) {
  const [open, setOpen] = useState(false);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add custom mood dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodCategory, setNewMoodCategory] = useState('custom');
  const [newMoodColor, setNewMoodColor] = useState('#6b7280');
  const [addingMood, setAddingMood] = useState(false);

  // Load custom moods on component mount
  useEffect(() => {
    loadCustomMoods();
  }, []);

  const loadCustomMoods = async () => {
    try {
      setLoading(true);
      const response = await brain.get_mood_definitions();
      const data = await response.json();
      
      if (data.success && data.moods) {
        // Filter only custom moods (non-predefined)
        const userCustomMoods = data.moods.filter((mood: any) => !mood.is_predefined);
        setCustomMoods(userCustomMoods);
      }
    } catch (error) {
      console.error('Error loading custom moods:', error);
      // Don't show error to user for this, just continue with predefined moods
    } finally {
      setLoading(false);
    }
  };

  // Combine predefined and custom moods
  const allMoods = useMemo(() => {
    const combined = [...PREDEFINED_MOODS, ...customMoods];
    
    // Sort by usage/frequency (custom moods with usage_count, predefined at the top)
    return combined.sort((a, b) => {
      // Predefined moods first
      if ('usage_count' in a && !('usage_count' in b)) return 1;
      if (!('usage_count' in a) && 'usage_count' in b) return -1;
      
      // Both custom - sort by usage count
      if ('usage_count' in a && 'usage_count' in b) {
        return (b as CustomMood).usage_count - (a as CustomMood).usage_count;
      }
      
      // Both predefined - keep original order
      return 0;
    });
  }, [customMoods]);

  // Group moods by category for better organization
  const groupedMoods = useMemo(() => {
    const groups: Record<string, typeof allMoods> = {
      positive: [],
      negative: [],
      neutral: [],
      custom: []
    };
    
    allMoods.forEach(mood => {
      if (groups[mood.category]) {
        groups[mood.category].push(mood);
      } else {
        groups.custom.push(mood);
      }
    });
    
    return groups;
  }, [allMoods]);

  const selectedMood = allMoods.find(mood => mood.id === value || mood.name === value);

  const handleAddCustomMood = async () => {
    if (!newMoodName.trim()) {
      toast.error('Please enter a mood name');
      return;
    }

    try {
      setAddingMood(true);
      
      const response = await brain.create_mood_definition({
        name: newMoodName.trim(),
        category: newMoodCategory,
        color: newMoodColor
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Custom mood added successfully!');
        
        // Reset form
        setNewMoodName('');
        setNewMoodCategory('custom');
        setNewMoodColor('#6b7280');
        setShowAddDialog(false);
        
        // Reload custom moods
        await loadCustomMoods();
      } else {
        toast.error(data.message || 'Failed to add custom mood');
      }
    } catch (error) {
      console.error('Error adding custom mood:', error);
      toast.error('Failed to add custom mood. Please try again.');
    } finally {
      setAddingMood(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'positive': return 'Positive Moods';
      case 'negative': return 'Challenging Moods';
      case 'neutral': return 'Neutral Moods';
      case 'custom': return 'Your Custom Moods';
      default: return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
      case 'custom': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[2.5rem] py-2"
          >
            {selectedMood ? (
              <div className="flex items-center gap-2">
                {selectedMood.icon && (
                  <span className="text-lg">{selectedMood.icon}</span>
                )}
                <span>{selectedMood.name}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    getCategoryColor(selectedMood.category)
                  )}
                  style={{ backgroundColor: `${selectedMood.color}20` }}
                >
                  {selectedMood.category}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search moods..." className="h-9" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No moods found</p>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Custom Mood
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CommandEmpty>
              
              {/* Positive Moods */}
              {groupedMoods.positive.length > 0 && (
                <CommandGroup heading={getCategoryLabel('positive')} className={getCategoryColor('positive')}>
                  {groupedMoods.positive.map((mood) => (
                    <CommandItem
                      key={mood.id}
                      value={mood.name}
                      onSelect={() => {
                        onChange(mood.name);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      {mood.icon && <span className="text-lg">{mood.icon}</span>}
                      <span className="flex-1">{mood.name}</span>
                      {'usage_count' in mood && mood.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mood.usage_count}
                        </Badge>
                      )}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === mood.name || value === mood.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Neutral Moods */}
              {groupedMoods.neutral.length > 0 && (
                <CommandGroup heading={getCategoryLabel('neutral')} className={getCategoryColor('neutral')}>
                  {groupedMoods.neutral.map((mood) => (
                    <CommandItem
                      key={mood.id}
                      value={mood.name}
                      onSelect={() => {
                        onChange(mood.name);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      {mood.icon && <span className="text-lg">{mood.icon}</span>}
                      <span className="flex-1">{mood.name}</span>
                      {'usage_count' in mood && mood.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mood.usage_count}
                        </Badge>
                      )}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === mood.name || value === mood.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Challenging/Negative Moods */}
              {groupedMoods.negative.length > 0 && (
                <CommandGroup heading={getCategoryLabel('negative')} className={getCategoryColor('negative')}>
                  {groupedMoods.negative.map((mood) => (
                    <CommandItem
                      key={mood.id}
                      value={mood.name}
                      onSelect={() => {
                        onChange(mood.name);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      {mood.icon && <span className="text-lg">{mood.icon}</span>}
                      <span className="flex-1">{mood.name}</span>
                      {'usage_count' in mood && mood.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mood.usage_count}
                        </Badge>
                      )}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === mood.name || value === mood.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Custom Moods */}
              {groupedMoods.custom.length > 0 && (
                <CommandGroup heading={getCategoryLabel('custom')} className={getCategoryColor('custom')}>
                  {groupedMoods.custom.map((mood) => (
                    <CommandItem
                      key={mood.id}
                      value={mood.name}
                      onSelect={() => {
                        onChange(mood.name);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      {mood.icon && <span className="text-lg">{mood.icon}</span>}
                      <span className="flex-1">{mood.name}</span>
                      {'usage_count' in mood && mood.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mood.usage_count}
                        </Badge>
                      )}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === mood.name || value === mood.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Add Custom Mood Option */}
              <CommandGroup>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <CommandItem className="flex items-center gap-2 py-2 text-blue-400 hover:text-blue-300">
                      <Plus className="h-4 w-4" />
                      <span>Add Custom Mood</span>
                    </CommandItem>
                  </DialogTrigger>
                </Dialog>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Add Custom Mood Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Mood</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mood-name">Mood Name</Label>
              <Input
                id="mood-name"
                placeholder="e.g., 'Impatient with EUR', 'Overthinking setups'"
                value={newMoodName}
                onChange={(e) => setNewMoodName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood-category">Category</Label>
              <Select value={newMoodCategory} onValueChange={setNewMoodCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Challenging</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood-color">Color (Optional)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="mood-color"
                  type="color"
                  value={newMoodColor}
                  onChange={(e) => setNewMoodColor(e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <span className="text-sm text-muted-foreground">{newMoodColor}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomMood} disabled={addingMood}>
              {addingMood ? 'Adding...' : 'Add Mood'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
