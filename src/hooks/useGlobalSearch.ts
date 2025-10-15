// src/hooks/useGlobalSearch.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// We rely on 'string' for the table name to bypass the strict, outdated type checking.
type DbTableName = string; 

// Define the structure for a unified search result
export interface SearchResult {
  id: string;
  // UPDATED: Added 'Deal' to the possible result types
  type: 'Activity' | 'Event' | 'Partner' | 'Profile' | 'Buddy' | 'Deal'; 
  title: string;
  description: string;
  link: string; 
}

// Define the tables and the paths to construct the final link
const SearchConfigs = [
    // Core tables found in your schema
    { table: 'activities' as DbTableName, type: 'Activity' as const, path: '/activities/', titleCol: 'title', descCol: 'description' },
    { table: 'events' as DbTableName, type: 'Event' as const, path: '/events/', titleCol: 'title', descCol: 'description' },
    
    // Tables using 'username' and 'bio'
    { table: 'travel_buddies' as DbTableName, type: 'Buddy' as const, path: '/travel-buddies/', titleCol: 'username', descCol: 'bio' },
    { table: 'profiles' as DbTableName, type: 'Profile' as const, path: '/profiles/', titleCol: 'username', descCol: 'bio' },

    // Featured Partners (using 'name' and 'description')
    { table: 'featured_partners' as DbTableName, type: 'Partner' as const, path: '/featured-partners/', titleCol: 'name', descCol: 'description' },
    
    // NEW: Deals table added now that it's confirmed to exist in the database
    { table: 'deals' as DbTableName, type: 'Deal' as const, path: '/deals/', titleCol: 'title', descCol: 'description' },
];

type SearchableTableName = typeof SearchConfigs[number]['table'];

const fetchGlobalSearch = async (query: string): Promise<SearchResult[]> => {
  if (!query) return [];

  const searchPromises = SearchConfigs.map(config => {
    // 1. SELECT: Alias columns to match the SearchResult interface (id, title, description)
    const selectString = `id, 
      ${config.titleCol} as title, 
      ${config.descCol} as description`;

    return supabase
      .from(config.table as any) // FIX 1: Bypasses Error 2769
      .select(selectString) 
      // 2. FILTER FIX: Use the original column names (config.titleCol, config.descCol) 
      //    in the ILIKE and OR clauses to avoid HTTP 400 errors.
      .ilike(config.titleCol, `%${query}%`) // Search by original title column
      // We explicitly check both the title and description/bio columns for the query
      .or(`${config.descCol}.ilike.%${query}%, ${config.titleCol}.ilike.%${query}%`) 
      .limit(5); 
  });

  const results = await Promise.all(searchPromises);
  let unifiedResults: SearchResult[] = [];

  type AliasedResultItem = { id: string, title: string, description: string };

  results.forEach((res, index) => {
    const config = SearchConfigs[index];

    if (res.data && !res.error) { 
      unifiedResults.push(
        ...res.data.map(item => {
            // FIX 3: Cast to unknown then to AliasedResultItem to resolve Error 2352
            const typedItem = item as unknown as AliasedResultItem; 
            return ({
              id: typedItem.id,
              type: config.type,
              title: typedItem.title,
              description: typedItem.description,
              link: `${config.path}${typedItem.id}`, 
            })
        })
      );
    } else if (res.error) {
        // Log errors from specific queries (e.g., if a column is truly missing)
        console.error(`Error searching table ${config.table}:`, res.error.message);
    }
  });

  return unifiedResults;
};

export const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: !!query && query.length > 2,
  });
};