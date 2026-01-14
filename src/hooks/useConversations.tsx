import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth'; 

export interface Conversation {
    id: string;
    display_name: string;
    last_message_text: string | null;
    last_message_at: string | null; 
}

export const useConversations = () => {
    const supabase = useSupabase();
    const { user, loading: isAuthLoading } = useAuth(); 
    const userId = user?.id; 
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const { data: partData } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
            const ids = (partData as any[] || []).map(p => p.conversation_id);
            
            if (ids.length === 0) { setConversations([]); return; }

            const { data: convs } = await supabase.from('conversations').select('*').in('id', ids).order('last_message_at', { ascending: false });
            const { data: others } = await supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', ids).neq('user_id', userId);
            
            const otherUserIds = (others as any[] || []).map(o => o.user_id);
            const { data: profiles } = await supabase.from('profiles').select('id, username, full_name').in('id', otherUserIds);

            const merged = (convs as any[] || []).map(c => {
                const p = (others as any[]).find(o => o.conversation_id === c.id);
                const prof = (profiles as any[])?.find(pr => pr.id === p?.user_id);
                return { ...c, display_name: prof?.username || prof?.full_name || "User" };
            });
            setConversations(merged);
        } finally { setIsLoading(false); }
    }, [supabase, userId]);

    // NEW: Logic to create a new chat record
    const startConversation = async (targetUserId: string) => {
        if (!userId) return null;

        // 1. Create the conversation row
        const { data: newConv, error: convErr } = await (supabase.from('conversations') as any)
            .insert({ last_message_text: 'New chat started' })
            .select().single();

        if (convErr) throw convErr;

        // 2. Add both users to the participants table
        const { error: partErr } = await (supabase.from('conversation_participants') as any).insert([
            { conversation_id: newConv.id, user_id: userId },
            { conversation_id: newConv.id, user_id: targetUserId }
        ]);

        if (partErr) throw partErr;

        await fetchConversations();
        return newConv.id;
    };

    useEffect(() => {
        if (!isAuthLoading && userId) fetchConversations();
    }, [isAuthLoading, userId, fetchConversations]);

    return { conversations, isLoading, startConversation, refresh: fetchConversations };
};