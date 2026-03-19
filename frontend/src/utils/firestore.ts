

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "utils/firebase";
import { Trade, Evaluation } from "utils/types";

// Exponential backoff utility for handling rate limiting
const withExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a rate limit error (429) or quota exceeded
      const isRateLimit = error?.code === 'resource-exhausted' || 
                          error?.message?.includes('Quota exceeded') ||
                          error?.message?.includes('429');
      
      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

// Simple in-memory cache for Firestore results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const firestoreCache = new Map<string, CacheEntry<any>>();

const getCachedData = <T>(key: string): T | null => {
  const entry = firestoreCache.get(key);
  if (!entry || Date.now() > entry.timestamp + entry.ttl) {
    firestoreCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCachedData = <T>(key: string, data: T, ttl = 300000) => { // 5 min default TTL
  firestoreCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Trade Functions
export const addTrade = async (userId: string, trade: Omit<Trade, "id" | "userId">) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/trades`), trade);

    return docRef.id;
  } catch (e) {

  }
};

export const getTrades = async (userId: string, forceRefresh = false): Promise<Trade[]> => {
  const cacheKey = `trades_${userId}`;
  
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cachedTrades = getCachedData<Trade[]>(cacheKey);
    if (cachedTrades) {
      console.log('Returning cached trades:', cachedTrades.length);
      return cachedTrades;
    }
  }
  
  try {
    console.log('Fetching fresh trades data for user:', userId);
    
    // Step 1: Get all evaluations with exponential backoff and better error handling
    let evaluationsSnapshot;
    try {
      evaluationsSnapshot = await withExponentialBackoff(async () => {
        const evaluationsQuery = query(collection(db, `users/${userId}/evaluations`));
        return await getDocs(evaluationsQuery);
      });
    } catch (evaluationError) {
      console.error('Failed to fetch evaluations from Firestore:', evaluationError);
      // Return empty array instead of throwing error
      console.log('Returning empty trades array due to evaluation fetch failure');
      setCachedData(cacheKey, [], 120000); // Cache empty result for 2 min
      return [];
    }
    
    console.log(`Found ${evaluationsSnapshot.docs.length} evaluations`);
    
    if (evaluationsSnapshot.empty) {
      console.log('No evaluations found, returning empty trades array');
      setCachedData(cacheKey, [], 120000); // Cache empty result for 2 min
      return [];
    }
    
    const allTrades: Trade[] = [];
    const evaluationData = new Map<string, any>();
    
    // Store evaluation metadata for later use
    evaluationsSnapshot.docs.forEach((doc) => {
      evaluationData.set(doc.id, doc.data());
    });
    
    // Step 2: Batch fetch trades from all evaluations with backoff
    const tradePromises = evaluationsSnapshot.docs.map((evaluationDoc) => {
      const evaluationId = evaluationDoc.id;
      
      return withExponentialBackoff(async () => {
        const tradesQuery = query(
          collection(db, `users/${userId}/evaluations/${evaluationId}/trades`)
        );
        const tradesSnapshot = await getDocs(tradesQuery);
        
        const evaluationTrades: Trade[] = [];
        tradesSnapshot.forEach((tradeDoc) => {
          const tradeData = { id: tradeDoc.id, ...tradeDoc.data() } as Trade;
          
          // Add evaluation metadata to trade if needed
          const evaluationInfo = evaluationData.get(evaluationId);
          if (!tradeData.accountId && evaluationInfo?.accountId) {
            tradeData.accountId = evaluationInfo.accountId;
          }
          
          // CRITICAL FIX: Add evaluationId to link trade back to its evaluation
          // This is essential for proper filtering of manual trades
          tradeData.evaluationId = evaluationId;
          
          evaluationTrades.push(tradeData);
        });
        
        console.log(`Fetched ${evaluationTrades.length} trades from evaluation ${evaluationId}`);
        return evaluationTrades;
      }).catch((tradeError) => {
        console.error(`Failed to fetch trades from evaluation ${evaluationId}:`, tradeError);
        return []; // Return empty array for this evaluation instead of failing entirely
      });
    });
    
    // Step 3: Wait for all trade fetches to complete
    console.log('Waiting for all trade batches to complete...');
    const tradeBatches = await Promise.all(tradePromises);
    
    // Step 4: Flatten all trades into single array
    tradeBatches.forEach((trades) => {
      allTrades.push(...trades);
    });
    
    console.log(`Successfully fetched ${allTrades.length} total trades`);
    
    // Cache the result for 5 minutes
    setCachedData(cacheKey, allTrades, 300000);
    
    return allTrades;
  } catch (error) {
    console.error('Error fetching trades from evaluations:', error);
    
    // Try to return cached data if available, even if expired
    const staleCache = firestoreCache.get(cacheKey);
    if (staleCache) {
      console.warn('Returning stale cached data due to error');
      return staleCache.data;
    }
    
    // Return empty array instead of throwing error to prevent page crashes
    console.log('Returning empty array due to complete failure');
    return [];
  }
};

export const updateTrade = async (
  userId: string,
  tradeId: string,
  updates: Partial<Trade>,
) => {
  try {
    // Find which evaluation contains this trade
    const evaluationsSnapshot = await getDocs(collection(db, `users/${userId}/evaluations`));
    
    let tradeFound = false;
    for (const evaluationDoc of evaluationsSnapshot.docs) {
      const evaluationId = evaluationDoc.id;
      
      // Check if trade exists in this evaluation
      const tradeRef = doc(db, `users/${userId}/evaluations/${evaluationId}/trades`, tradeId);
      const tradeDoc = await getDoc(tradeRef);
      
      if (tradeDoc.exists()) {
        // Update the trade in the correct evaluation
        await updateDoc(tradeRef, updates);
        console.log(`Updated trade ${tradeId} in evaluation ${evaluationId}`);
        tradeFound = true;
        break;
      }
    }
    
    if (!tradeFound) {
      console.error(`Trade ${tradeId} not found in any evaluation for user ${userId}`);
      throw new Error(`Trade not found: ${tradeId}`);
    }

  } catch (e) {
    console.error('Error updating trade:', e);
    throw e;
  }
};

// Evaluation Functions
export const addEvaluation = async (userId: string, evaluation: Omit<Evaluation, "id" | "userId">) => {
    try {
        const docRef = await addDoc(collection(db, `users/${userId}/evaluations`), evaluation);

        return docRef.id;
    } catch (e) {

    }
}

export const getEvaluations = async (userId: string, forceRefresh = false): Promise<Evaluation[]> => {
  const cacheKey = `evaluations_${userId}`;
  
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cachedEvaluations = getCachedData<Evaluation[]>(cacheKey);
    if (cachedEvaluations) {
      console.log('Returning cached evaluations:', cachedEvaluations.length);
      return cachedEvaluations;
    }
  }
  
  try {
    console.log('Fetching fresh evaluations data for user:', userId);
    
    const evaluationsSnapshot = await withExponentialBackoff(async () => {
      const evaluationsQuery = query(collection(db, `users/${userId}/evaluations`));
      return await getDocs(evaluationsQuery);
    });
    
    console.log(`Found ${evaluationsSnapshot.docs.length} evaluations`);
    
    const evaluations: Evaluation[] = [];
    evaluationsSnapshot.forEach((doc) => {
      const data = doc.data();
      const evaluation: Evaluation = {
        ...data,
        id: doc.id, // Set document ID after spreading data to ensure it's not overwritten
        accountId: data.accountId || '',
        platform: data.platform || 'manual',
        type: data.type || 'demo',
        status: data.status || 'active',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        balance: data.balance || null
      };
      evaluations.push(evaluation);
    });
    
    // Cache the result
    setCachedData(cacheKey, evaluations);
    
    console.log('Successfully fetched evaluations:', evaluations.length);
    return evaluations;
    
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw error;
  }
}

export const updateEvaluation = async (userId: string, evaluation: Evaluation) => {
    try {
        const evaluationRef = doc(db, `users/${userId}/evaluations`, evaluation.id);
        const { id, ...updateData } = evaluation; // Remove id from update data
        await updateDoc(evaluationRef, updateData);
        return evaluation.id;
    } catch (e) {
        console.error('Error updating evaluation:', e);
        throw e;
    }
}

export const deleteEvaluation = async (userId: string, evaluationId: string) => {
    try {
        const evaluationRef = doc(db, `users/${userId}/evaluations`, evaluationId);
        await deleteDoc(evaluationRef);
        return evaluationId;
    } catch (e) {
        console.error('Error deleting evaluation:', e);
        throw e;
    }
}

export const addWithdrawal = async (
  userId: string,
  accountId: string,
  withdrawal: { amount: number; date: string },
) => {
  try {
    const accountRef = doc(db, `users/${userId}/evaluations`, accountId);
    await updateDoc(accountRef, {
      withdrawals: arrayUnion(withdrawal),
    });

  } catch (e) {

  }
};
