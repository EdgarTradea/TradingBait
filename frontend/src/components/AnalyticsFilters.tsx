

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Trade, Evaluation } from "utils/types";
import { Badge } from "@/components/ui/badge";
import { X, Tag, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TIMEZONES } from "utils/timezones";

interface Props {
  trades: Trade[];
  evaluations: Evaluation[];
  onFiltersChange: (filters: {
    accountId: string | null;
    symbol: string | null;
    dateRange: DateRange | undefined;
    selectedTags: string[];
    timezone: string;
  }) => void;
  initialTimezone?: string;
}

export function AnalyticsFilters({
  evaluations,
  onFiltersChange,
  trades,
  initialTimezone = "UTC",
}: Props) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [timezone, setTimezone] = useState<string>(initialTimezone);

  const accounts = useMemo(() => {
    return evaluations.map((e) => ({
      id: e.id,
      accountId: e.accountId,
      name: `${e.firm} - ${e.accountId}`,
    }));
  }, [evaluations]);

  const symbols = useMemo(() => {
    const filteredTrades = accountId
      ? trades.filter((t) => {
          // Method 1: Check direct evaluationId field (for manual trades)
          if (t.evaluationId === accountId) {
            return true;
          }
          
          // Method 2: Check accountId field (for imported trades)
          if (t.accountId === accountId) {
            return true;
          }
          
          // Method 3: Find evaluation by matching accountId and check evaluation ID
          const matchingEvaluation = evaluations.find(
            (evaluation) => evaluation.accountId === t.accountId,
          );
          return matchingEvaluation?.id === accountId;
        })
      : trades;
    return Array.from(new Set(filteredTrades.map((t) => t.symbol)));
  }, [trades, accountId, evaluations]);

  // Extract all unique tags from trades
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    trades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          if (tag && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [trades]);

  // Get count of trades per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach(trade => {
      if (trade.tags && Array.isArray(trade.tags)) {
        trade.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const trimmedTag = tag.trim();
            counts[trimmedTag] = (counts[trimmedTag] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [trades]);

  const handleAccountChange = (value: string) => {
    const newAccountId = value === "all" ? null : value;
    setAccountId(newAccountId);
    setSymbol(null); // Reset symbol when account changes
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
  };

  const handleApplyFilters = () => {
    onFiltersChange({ accountId, symbol, dateRange, selectedTags, timezone });
  };


  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg backdrop-blur-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={accountId || "all"}
          onValueChange={handleAccountChange}
        >
          <SelectTrigger className="w-full bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={timezone}
          onValueChange={setTimezone}
        >
          <SelectTrigger className="w-full bg-gray-800 border-gray-700">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Select Timezone" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white max-h-[300px]">
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={symbol || "all"}
          onValueChange={(value) => setSymbol(value === "all" ? null : value)}
          disabled={!symbols.length}
        >
          <SelectTrigger className="w-full bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select Symbol" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            <SelectItem value="all">All Symbols</SelectItem>
            {symbols.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <span className="truncate">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      <span className="hidden sm:inline">
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </span>
                      <span className="sm:hidden">
                        {format(dateRange.from, "MM/dd")} - {format(dateRange.to, "MM/dd")}
                      </span>
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick date range</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 text-white" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Tags Multi-Select */}
        <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Tag className="h-4 w-4 mr-2" />
              <span className="truncate">
                {selectedTags.length > 0 ? (
                  <span>{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected</span>
                ) : (
                  <span>Select tags</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-700 text-white" align="start">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Filter by Tags</h4>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllTags}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              {availableTags.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                        className="border-gray-600"
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="flex-1 text-sm cursor-pointer hover:text-blue-300"
                      >
                        {tag}
                      </label>
                      <span className="text-xs text-gray-400">
                        ({tagCounts[tag] || 0})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No tags found in trades</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400 self-center">Selected tags:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-600/20 text-blue-300 border-blue-500/30 flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-white"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      <Button 
        onClick={handleApplyFilters} 
        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0"
      >
        Apply Filters
      </Button>
    </div>
  );
}
