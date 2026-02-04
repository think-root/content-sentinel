import { useState, useEffect, useCallback, useRef } from 'react';
import { getRepositories } from '../api';
import type { TimeRange } from './useOverviewHistory';

interface TrendMetric {
  keyword: string;
  count: number;
}

interface UseRepositoryTrendsResult {
  trends: TrendMetric[];
  loading: boolean;
  error: string | null;
}

export const useRepositoryTrends = (timeRange: TimeRange, isApiReady: boolean): UseRepositoryTrendsResult => {
  const [trends, setTrends] = useState<TrendMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to extract keywords from text
  const extractKeywords = useCallback((text: string): string[] => {
    // 1. Common stop words to exclude (expanded list)
    const stopWords = new Set([
      'the', 'and', 'or', 'of', 'to', 'in', 'a', 'an', 'is', 'for', 'on', 'with', 'by', 'as', 
      'at', 'from', 'it', 'that', 'this', 'which', 'be', 'are', 'was', 'were', 'has', 'have', 
      'had', 'but', 'not', 'so', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 
      'any', 'some', 'no', 'out', 'up', 'down', 'about', 'into', 'over', 'after', 'before',
      'under', 'above', 'only', 'just', 'more', 'most', 'such', 'like', 'than', 'can', 'could',
      'will', 'would', 'should', 'may', 'might', 'must', 'do', 'does', 'did', 'done', 'get',
      'got', 'make', 'made', 'see', 'saw', 'seen', 'use', 'used', 'using', 'new', 'old', 
      'good', 'bad', 'high', 'low', 'great', 'small', 'big', 'large', 'long', 'short', 
      'best', 'better', 'top', 'simple', 'complex', 'easy', 'hard', 'real', 'virtual',
      'api', 'app', 'web', 'data', 'code', 'file', 'user', 'system', 'tool' // Generic tech terms to maybe exclude? User asked for technologies
      // We will keep 'API', 'CLI' etc if they are capitalized properly
    ]);

    const keywords: string[] = [];
    
    // Regex explaination:
    // 1. Acronyms (2+ Uppercase): \b[A-Z]{2,}\b (e.g., AI, CLI, SVGs, ASCII)
    // 2. Mixed/Camel/Pascal (with at least one uppercase): \b[a-zA-Z]*[A-Z][a-zA-Z]*\b
    //    This is broad, so we refine it.
    
    // Strategy: Split by non-word chars, then analyze each token
    const tokens = text.replace(/[^\w\s-]/g, ' ').split(/\s+/);

    tokens.forEach(token => {
       // Trim punctuation just in case
       const cleanToken = token.replace(/^[-_]+|[-_]+$/g, '');
       if (cleanToken.length < 2) return;

       // Check specific patterns requested by user
       
       // 1. Acronyms: 2+ Uppercase letters (AI, CLI, SVGs)
       // allowing 's' at the end for plural like SVGs
       if (/^[A-Z]{2,}s?$/.test(cleanToken)) {
         keywords.push(cleanToken);
         return;
       }

       // 2. PascalCase / MixedCase (Polymarket, CPython, qBittorrent, iOS)
       // Must contain at least one uppercase letter
       // Must not be all uppercase (handled above)
       // Exclude simple capitalized stop words (The, And)
       if (/[A-Z]/.test(cleanToken)) {
          // Check if it's just a capitalized regular word at start of sentence
          // We can't strictly know if it's start of sentence here easily without context,
          // but we can check against stop words.
          
          const lower = cleanToken.toLowerCase();
          if (stopWords.has(lower)) return;

          // Additional heuristic: 
          // If it starts with Uppercase and rest is lowercase, it might be a proper noun or just a word.
          // User asked specifically for "Polymarket" (Pascal) and "qBittorrent" (camel).
          
          // Let's include it if it passes stopWord filter.
          // Optimisation: Exclude very common english words even if capitalized?
          // For now, rely on frequency. "The" is in stopWords. "Python" is not.

          keywords.push(cleanToken);
          return;
       }

       // 3. Hyphenated specific Tech (DAW-like)
       // Contains a hyphen and has some uppercase or specific structure?
       // User example: "DAW-like". 
       if (cleanToken.includes('-') && /[A-Z]/.test(cleanToken)) {
         keywords.push(cleanToken);
         return;
       }

    });

    return keywords;
  }, []);

  const fetchTrends = useCallback(async () => {
    if (!isApiReady) return;

    setLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeRange) {
        case '24h': cutoffDate.setDate(now.getDate() - 1); break;
        case '7d': cutoffDate.setDate(now.getDate() - 7); break;
        case '30d': cutoffDate.setDate(now.getDate() - 30); break;
        case '90d': cutoffDate.setDate(now.getDate() - 90); break;
      }

      const allKeywords: Record<string, number> = {};
      let page = 1;
      const pageSize = 50;
      let keepFetching = true;

      while (keepFetching) {
        // Check for abort signal
        if (abortControllerRef.current?.signal.aborted) return;

        // Fetch page
        const response = await getRepositories(
          pageSize,
          undefined, // posted filter (undefined = all)
          false, // fetchAll
          'date_added',
          'DESC', // Newest first to allow early exit
          page,
          pageSize
        );

        // API signatures checks:
        // getRepositories signature: (limit, posted, fetchAll, sortBy, sortOrder, page, pageSize)
        // In previous files I saw usage: getRepositories(..., 'date_added', 'ASC', ...)
        // Let's check api.ts again carefully.
        // It passes sort_order to backend. The backend likely respects SQL standard.
        // So we want DESC to get recent items first.
        
        // CORRECTION: In the hook call above I passed 'ASC'. I need 'DESC'.
        // Wait, I can't overwrite the previous logic in the loop immediately. 
        // I will fix this in the actual call below carefully.

        // Re-declaring for clarity in this thought process:
        // We need NEWEST repositories first.
        // If the API defaults to ASC (Oldest first), we must explicitly send DESC.

        if (!response || !response.data || response.data.items.length === 0) {
          keepFetching = false;
          break;
        }

        const items = response.data.items;
        
        // Process items
        for (const repo of items) {
          const dateAdded = new Date(repo.date_added || new Date()); // Fallback if missing
          
          if (dateAdded < cutoffDate) {
            keepFetching = false; 
            // We can break the inner loop, but we also want to stop fetching pages.
             // But wait, if the sort order is *truly* DESC, then all subsequent items are older.
             // If sort order is ASC, we started with oldest.
             
             // Let's assume we request DESC.
             break; 
          }

          // Process this repo
          // Use text (description)
          if (repo.text) {
             const keys = extractKeywords(repo.text);
             keys.forEach(k => {
               allKeywords[k] = (allKeywords[k] || 0) + 1;
             });
          }
        }
        
        // Prepare next page
        page++;
        
        // Safety break for very large datasets if needed, or if API returns total pages we can check.
        if (page > (response.data.total_pages || 100)) {
            keepFetching = false;
        }
      }

      // Aggregate and Sort
      const sortedTrends = Object.entries(allKeywords)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20

      setTrends(sortedTrends);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch repository trends:", err);
        setError("Failed to load trends");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [timeRange, isApiReady, extractKeywords]);

  useEffect(() => {
    fetchTrends();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchTrends]);

  return { trends, loading, error };
};
