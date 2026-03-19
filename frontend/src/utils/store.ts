


import { create } from "zustand";
import { Trade, Evaluation } from "utils/types";
import { ChallengeConfig, ChallengeProgress, ChallengeHistory } from "utils/challengeTypes";
import {
  getTrades,
  addTrade,
  updateTrade,
  getEvaluations,
  addEvaluation,
  addWithdrawal,
} from "utils/firestore";
import brain from "brain";

// Cache interface for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

interface CacheStore {
  trades: Map<string, CacheEntry<Trade[]>>;
  evaluations: Map<string, CacheEntry<Evaluation[]>>;
  journalEntries: Map<string, CacheEntry<any[]>>;
  calculations: Map<string, CacheEntry<any>>;
  challenges: Map<string, CacheEntry<ChallengeConfig[]>>;
}

// Cache configuration
const CACHE_CONFIG = {
  TRADES_TTL: 5 * 60 * 1000, // 5 minutes
  EVALUATIONS_TTL: 10 * 60 * 1000, // 10 minutes
  JOURNAL_TTL: 3 * 60 * 1000, // 3 minutes
  CALCULATIONS_TTL: 2 * 60 * 1000, // 2 minutes
  CHALLENGES_TTL: 10 * 60 * 1000, // 10 minutes
};

interface StoreState {
  trades: Trade[];
  evaluations: Evaluation[];
  journalEntries: any[];
  challenges: ChallengeConfig[];
  activeChallenge: ChallengeConfig | null;
  loading: boolean;
  isSidebarCollapsed: boolean;
  
  // Cache store
  cache: CacheStore;
  
  // Actions
  toggleSidebar: () => void;
  fetchTrades: (userId: string, forceRefresh?: boolean) => Promise<void>;
  addTrade: (userId: string, trade: Omit<Trade, "id" | "userId">) => Promise<void>;
  fetchEvaluations: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchJournalEntries: (userId: string, forceRefresh?: boolean) => Promise<void>;
  addEvaluation: (
    userId: string,
    evaluation: Omit<Evaluation, "id" | "userId">,
  ) => Promise<void>;
  addWithdrawal: (
    userId: string,
    accountId: string,
    amount: number,
    date: string,
  ) => Promise<void>;
  updateTradeTags: (userId: string, tradeId: string, tags: string[]) => Promise<void>;
  updateTradeNotes: (userId: string, tradeId: string, notes: string) => Promise<void>;
  
  // Challenge actions
  fetchChallenges: (userId: string, forceRefresh?: boolean) => Promise<void>;
  addChallenge: (userId: string, challenge: ChallengeConfig) => Promise<void>;
  updateChallenge: (userId: string, challengeId: string, updates: Partial<ChallengeConfig>) => Promise<void>;
  setActiveChallenge: (challenge: ChallengeConfig | null) => void;
  deleteChallenge: (userId: string, challengeId: string) => Promise<void>;
  
  // Cache management
  getCachedData: <T>(cacheType: keyof CacheStore, key: string) => T | null;
  setCachedData: <T>(cacheType: keyof CacheStore, key: string, data: T, ttl: number) => void;
  clearCache: (cacheType?: keyof CacheStore) => void;
  invalidateUserCache: (userId: string) => void;
}

// Helper functions for cache management
const isExpired = (entry: CacheEntry<any>): boolean => {
  return Date.now() > entry.timestamp + entry.expiresIn;
};

const createCacheEntry = <T>(data: T, ttl: number): CacheEntry<T> => ({
  data,
  timestamp: Date.now(),
  expiresIn: ttl,
});

export const useStore = create<StoreState>((set, get) => ({
  trades: [],
  evaluations: [],
  journalEntries: [],
  challenges: [],
  activeChallenge: null,
  loading: false,
  isSidebarCollapsed: false,
  
  // Initialize cache
  cache: {
    trades: new Map(),
    evaluations: new Map(),
    journalEntries: new Map(),
    calculations: new Map(),
    challenges: new Map(),
  },
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  
  // Cache management methods
  getCachedData: <T>(cacheType: keyof CacheStore, key: string): T | null => {
    const cacheMap = get().cache[cacheType] as Map<string, CacheEntry<T>>;
    const entry = cacheMap.get(key);
    
    if (!entry || isExpired(entry)) {
      cacheMap.delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  setCachedData: <T>(cacheType: keyof CacheStore, key: string, data: T, ttl: number) => {
    const state = get();
    const cacheMap = state.cache[cacheType] as Map<string, CacheEntry<T>>;
    cacheMap.set(key, createCacheEntry(data, ttl));
  },
  
  clearCache: (cacheType?: keyof CacheStore) => {
    const state = get();
    if (cacheType) {
      state.cache[cacheType].clear();
    } else {
      // Clear all caches
      Object.values(state.cache).forEach(cache => cache.clear());
    }
  },
  
  invalidateUserCache: (userId: string) => {
    const state = get();
    // Remove all cache entries for this user
    [state.cache.trades, state.cache.evaluations, state.cache.journalEntries, state.cache.challenges].forEach(cache => {
      for (const key of cache.keys()) {
        if (key.startsWith(userId)) {
          cache.delete(key);
        }
      }
    });
  },

  fetchTrades: async (userId: string, forceRefresh = false) => {
    const cacheKey = `${userId}_trades`;
    
    // Check Zustand cache first unless force refresh
    if (!forceRefresh) {
      const cachedTrades = get().getCachedData<Trade[]>('trades', cacheKey);
      if (cachedTrades) {
        set({ trades: cachedTrades, loading: false });
        return;
      }
    }
    
    set({ loading: true });
    try {
      // Use the optimized getTrades function with its own caching and backoff
      const trades = await getTrades(userId, forceRefresh);
      // Cache the result in Zustand cache as well
      get().setCachedData('trades', cacheKey, trades, CACHE_CONFIG.TRADES_TTL);
      set({ trades, loading: false });
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      set({ loading: false });
    }
  },

  addTrade: async (userId: string, trade: Omit<Trade, "id" | "userId">) => {
    set({ loading: true });
    try {
      await addTrade(userId, trade);
      // Invalidate cache to force refresh
      get().invalidateUserCache(userId);
      await get().fetchTrades(userId, true);
    } catch (error) {
      console.error('Failed to add trade:', error);
      set({ loading: false });
    }
  },

  fetchEvaluations: async (userId: string, forceRefresh = false) => {
    const cacheKey = `${userId}_evaluations`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedEvaluations = get().getCachedData<Evaluation[]>('evaluations', cacheKey);
      if (cachedEvaluations) {
        set({ evaluations: cachedEvaluations, loading: false });
        return;
      }
    }
    
    set({ loading: true });
    try {
      const evaluations = await getEvaluations(userId);
      // Cache the result
      get().setCachedData('evaluations', cacheKey, evaluations, CACHE_CONFIG.EVALUATIONS_TTL);
      set({ evaluations, loading: false });
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      set({ loading: false });
    }
  },

  fetchJournalEntries: async (userId: string, forceRefresh = false) => {
    const cacheKey = `${userId}_journal`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedEntries = get().getCachedData<any[]>('journalEntries', cacheKey);
      if (cachedEntries) {
        set({ journalEntries: cachedEntries });
        return;
      }
    }
    
    try {
      const response = await brain.get_journal_entries({ limit: 90 });
      const data = await response.json();
      const journalEntries = data?.entries || []; // Updated to match new API structure
      
      // Cache the result
      get().setCachedData('journalEntries', cacheKey, journalEntries, CACHE_CONFIG.JOURNAL_TTL);
      set({ journalEntries });
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      set({ journalEntries: [] });
    }
  },

  addEvaluation: async (userId: string, evaluation: Omit<Evaluation, "id" | "userId">) => {
    set({ loading: true });
    try {
      await addEvaluation(userId, evaluation);
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchEvaluations(userId, true);
    } catch (error) {
      console.error('Failed to add evaluation:', error);
      set({ loading: false });
    }
  },

  addWithdrawal: async (userId: string, accountId: string, amount: number, date: string) => {
    set({ loading: true });
    try {
      await addWithdrawal(userId, accountId, { amount, date });
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchEvaluations(userId, true);
    } catch (error) {
      console.error('Failed to add withdrawal:', error);
      set({ loading: false });
    }
  },
  
  updateTradeTags: async (userId: string, tradeId: string, tags: string[]) => {
    set({ loading: true });
    try {
      await updateTrade(userId, tradeId, { tags });
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchTrades(userId, true);
    } catch (error) {
      console.error('Failed to update trade tags:', error);
      set({ loading: false });
    }
  },
  
  updateTradeNotes: async (userId: string, tradeId: string, notes: string) => {
    set({ loading: true });
    try {
      await updateTrade(userId, tradeId, { notes });
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchTrades(userId, true);
    } catch (error) {
      console.error('Failed to update trade notes:', error);
      set({ loading: false });
    }
  },
  
  fetchChallenges: async (userId: string, forceRefresh = false) => {
    const cacheKey = `${userId}_challenges`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedChallenges = get().getCachedData<ChallengeConfig[]>('challenges', cacheKey);
      if (cachedChallenges) {
        set({ challenges: cachedChallenges });
        return;
      }
    }
    
    try {
      const response = await brain.get_challenges({});
      const data = await response.json();
      const challenges = data?.challenges || []; // Updated to match new API structure
      
      // Cache the result
      get().setCachedData('challenges', cacheKey, challenges, CACHE_CONFIG.CHALLENGES_TTL);
      set({ challenges });
    } catch (error) {
      console.error('Error fetching challenges:', error);
      set({ challenges: [] });
    }
  },
  
  addChallenge: async (userId: string, challenge: ChallengeConfig) => {
    set({ loading: true });
    try {
      await brain.add_challenge(challenge);
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchChallenges(userId, true);
    } catch (error) {
      console.error('Failed to add challenge:', error);
      set({ loading: false });
    }
  },
  
  updateChallenge: async (userId: string, challengeId: string, updates: Partial<ChallengeConfig>) => {
    set({ loading: true });
    try {
      await brain.update_challenge(challengeId, updates);
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchChallenges(userId, true);
    } catch (error) {
      console.error('Failed to update challenge:', error);
      set({ loading: false });
    }
  },
  
  setActiveChallenge: (challenge: ChallengeConfig | null) => {
    set({ activeChallenge: challenge });
  },
  
  deleteChallenge: async (userId: string, challengeId: string) => {
    set({ loading: true });
    try {
      await brain.delete_challenge(challengeId);
      // Invalidate cache and refresh
      get().invalidateUserCache(userId);
      await get().fetchChallenges(userId, true);
    } catch (error) {
      console.error('Failed to delete challenge:', error);
      set({ loading: false });
    }
  },
}));
