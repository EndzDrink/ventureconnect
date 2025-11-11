import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// NOTE: Replace these with the actual environment variables or configuration method
// your project uses to access the Supabase URL and Anon Key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

// Simplified Database type definition to help with client typing
interface Database {
    // Defines tables within the 'public' schema
    public: {
        Tables: {
            conversations: { Row: any; Insert: any; Update: any; };
            messages: { Row: any; Insert: any; Update: any; };
        };
        Functions: {};
    };
    // We only use the "public" schema for this chat app
}


/**
 * A custom hook to provide a memoized Supabase client instance.
 * Explicitly forces the schema to "public" to resolve type mismatch errors.
 * @returns {SupabaseClient<Database, "public">} The Supabase client instance.
 */
export const useSupabase = (): SupabaseClient<Database, "public"> => {
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    
    // Crucial fix: Initialize the Supabase client, explicitly setting the schema to 'public'
    return createClient<Database, "public">(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: 'public',
        }
    });
  }, []);

  return supabase;
};