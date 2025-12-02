import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// FIX: Use Vite's method for accessing environment variables (import.meta.env).
// VITE requires that public environment variables start with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ilidtqlbkwyoxoowyggl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaWR0cWxia3d5b3hvb3d5Z2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE3NDIsImV4cCI6MjA3MTc3Nzc0Mn0.hvBhSWEJuu8rXBwm7d6-h0ywNULDrh8J1td4_WGHOgo';

// Simplified Database type definition to help with client typing
interface Database {
    // Defines tables within the 'public' schema
    public: {
        Tables: {
            conversations: { Row: any; Insert: any; Update: any; };
            messages: { Row: any; Insert: any; Update: any; };
            conversation_participants: { Row: any; Insert: any; Update: any; }; 
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
      console.error("Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
    }
    
    // Crucial fix: Initialize the Supabase client, explicitly setting the schema to 'public'
    return createClient<Database, "public">(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: 'public',
        }
    });
  }, []);

  return supabase; 
}