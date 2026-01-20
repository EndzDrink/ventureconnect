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

    const startConversation = async (targetUserId: string) => {
        if (!userId) return null;
    
        try {
            // 1. IMPROVED CHECK: Find a conversation where BOTH you and the target user are participants
            const { data: myConversations } = await (supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId) as any);
            
            const myIds = (myConversations || []).map((c: any) => c.conversation_id);

            const { data: existing } = await (supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', targetUserId)
                .in('conversation_id', myIds)
                .limit(1) as any);
    
            if (existing && existing.length > 0) {
                return existing[0].conversation_id;
            }
    
            // 2. Create new conversation entry (only if no shared chat was found)
            const { data: newConv, error: convErr } = await (supabase.from('conversations') as any)
                .insert({ last_message_text: 'New conversation started' })
                .select()
                .single();
    
            if (convErr || !newConv) {
                console.error("Database blocked or failed conversation creation:", convErr);
                return null;
            }
    
            // 3. Link both users as participants
            const { error: partErr } = await (supabase.from('conversation_participants') as any)
                .insert([
                    { conversation_id: newConv.id, user_id: userId },
                    { conversation_id: newConv.id, user_id: targetUserId }
                ]);
    
            if (partErr) {
                console.error("Failed to link participants:", partErr);
                return null;
            }
    
            await fetchConversations();
            return newConv.id;
        } catch (err) {
            console.error("Error in startConversation:", err);
            return null;
        }
    };

    useEffect(() => {
        if (!isAuthLoading && userId) fetchConversations();
    }, [isAuthLoading, userId, fetchConversations]);

    return { conversations, isLoading, startConversation, refresh: fetchConversations };
};