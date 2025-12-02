import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth'; 
import { RealtimeChannel } from '@supabase/supabase-js'; // Needed for real-time listener

// --- Type Definitions (UPDATED) ---

// Define the shape of a single Message row
export interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string; // Formatted timestamp
    conversation_id: string;
}

// Define the shape of a Conversation row (ADDED properties for display)
export interface Conversation {
    id: string;
    // Added based on your screenshot errors:
    display_name: string; 
    last_message_text: string;
    last_message_at: string; // <
    participant_ids: string[]; // e.g., ['user1-uuid', 'user2-uuid']
    created_at: string; // Add a timestamp for ordering
}

// Define the return shape of the custom hook
export interface UseConversationsResult {
    conversations: Conversation[];
    isLoading: boolean;
    error: Error | null;
    fetchMessages: (conversationId: string) => Promise<Message[]>; 
}

// --- Custom Hook (FIXED) ---

/**
 * Custom hook to fetch and manage a user's conversations.
 * @returns {UseConversationsResult}
 */
export const useConversations = (): UseConversationsResult => {
    const supabase = useSupabase();
    // FIX 1: Destructure 'user' and 'loading' from useAuth, then calculate userId
    const { user, loading: isAuthLoading } = useAuth(); // Renaming 'loading' to 'isAuthLoading' for clarity
    const userId = user?.id; // Calculating userId from the user object
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // --- 1. Fetch Conversations on Load ---
    useEffect(() => {
        // If the user state is still loading, wait.
        if (isAuthLoading) return;
        
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                // Fetch conversations where the user is a participant
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*, participants(id, display_name)') // Adjust select to fetch participant data if necessary
                    .contains('participant_ids', [userId]) 
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                setConversations(data as Conversation[]);
                setError(null);

            } catch (err) {
                console.error("Error fetching conversations:", err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();

    }, [supabase, userId, isAuthLoading]); // Added isAuthLoading to dependencies


    // --- 2. Function to Fetch Messages for a Conversation ---
    const fetchMessages = async (conversationId: string): Promise<Message[]> => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            return data as Message[];

        } catch (err) {
            console.error(`Error fetching messages for ${conversationId}:`, err);
            return []; 
        }
    };

    // --- 3. Return the Hook State and Functions ---
    return {
        conversations,
        isLoading,
        error,
        fetchMessages,
    };
};