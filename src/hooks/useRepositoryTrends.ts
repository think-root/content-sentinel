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

export const useRepositoryTrends = (timeRange: TimeRange, isApiReady: boolean, sortBy: 'date_added' | 'date_posted' = 'date_added'): UseRepositoryTrendsResult => {
  const [trends, setTrends] = useState<TrendMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to extract keywords from text
  const extractKeywords = useCallback((text: string): string[] => {
    // 1. Common stop words to exclude
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
      'api', 'app', 'web', 'data', 'code', 'file', 'user', 'system', 'tool', 'agent', 'sdk', 'router'
      // Note: 'agent', 'sdk', 'router' might be part of specific names perfectly valid (e.g. Claude Agent SDK)
      // but "Agent" alone might be too generic. Let's exclude common generic IT terms if they appear alone?
      // For now, let's keep them in exclusion if single, but multi-word logic won't check stoplist for parts except start/end.
    ]);

    const keywords: string[] = [];
    
    // Normalize text: Replace slashes with spaces to handle "OpenAI/Gemini" -> "OpenAI Gemini"
    // Also handle other separators if needed, but keeping hyphen usage.
    let processedText = text.replace(/\//g, ' / ');

    // 1. Extract Multi-word Tech Names (Consecutive Capitalized Words)
    // e.g. "Claude Code", "Composio Tool Router", "Claude Agent SDK"
    // Regex: Match word starting with Uppercase, followed by space, followed by another Capitalized word.
    // Allow hyphens inside words.
    const multiWordRegex = /\b([A-Z][a-zA-Z0-9-]*\s+(?:[A-Z][a-zA-Z0-9-]*\s*)+)\b/g;

    let match;
    while ((match = multiWordRegex.exec(processedText)) !== null) {
      const phrase = match[0].trim();
      // Heuristic: check if the first word is a stop word (e.g. "The OpenAI")
      const parts = phrase.split(/\s+/);

      // If phrase is just "Start Word that is capitalized", ignore
      if (parts.length < 2) continue;

      // Filter: if first word is 'The' or similar common word, remove it or skip?
      // "The Claude Code" -> "Claude Code"
      if (stopWords.has(parts[0].toLowerCase())) {
        if (parts.length > 2) {
          keywords.push(parts.slice(1).join(' ')); // "The Claude Code" -> "Claude Code"
        }
        // If "The AI", "AI" will be caught by single word logic later if we don't consume it here.
        // Let's NOT consume invalid phrases so single-word logic can handle parts?
        // No, if we consume "Claude Code", we don't want "Claude" and "Code" again.
        // So we should capture valid things and remove them or mark them.
      } else {
        keywords.push(phrase);
      }
    }

    // Remove the found multi-word phrases from text to avoid double counting single words?
    // Or simpler: Just run single word logic on the whole text, but maybe that inflates counts or adds partial noise.
    // User wants "Claude Code" as ONE entity. If we also count "Claude", then "Claude" gets +1.
    // Usually that's fine (Hierarchy), but user specifically said "treat as one name".
    // So let's replace matches with whitespace.
    processedText = processedText.replace(multiWordRegex, ' ');

    // 2. Extract Single Tech Words
    const tokens = processedText.replace(/[^\w\s-]/g, ' ').split(/\s+/);

    tokens.forEach(token => {
       const cleanToken = token.replace(/^[-_]+|[-_]+$/g, '');
       if (cleanToken.length < 2) return;

      // 2a. Acronyms (AI, CLI, SVGs)
       if (/^[A-Z]{2,}s?$/.test(cleanToken)) {
         keywords.push(cleanToken);
         return;
       }

      // 2b. PascalCase / MixedCase / Hyphenated (Polymarket, CPython, DAW-like)
      // Minimum one uppercase letter required.
      if (/[A-Z]/.test(cleanToken)) {
          const lower = cleanToken.toLowerCase();
         // Strict stop word check
          if (stopWords.has(lower)) return;

         keywords.push(cleanToken);
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
          sortBy,
          'DESC', // Newest first to allow early exit
          page,
          pageSize
        );

        if (!response || !response.data || response.data.items.length === 0) {
          keepFetching = false;
          break;
        }

        const items = response.data.items;
        
        // Process items
        for (const repo of items) {
          const dateStr = sortBy === 'date_posted' ? repo.date_posted : repo.date_added;
          const dateValue = dateStr ? new Date(dateStr) : (sortBy === 'date_added' ? new Date() : null);
          if (!dateValue) continue;

          if (dateValue < cutoffDate) {
            keepFetching = false; 
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
  }, [timeRange, isApiReady, extractKeywords, sortBy]);

  useEffect(() => {
    fetchTrends();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchTrends]);

  return { trends, loading, error };
};
