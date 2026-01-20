import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth'; 

export interface Conversation {
    id: string;
    display_name: string;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count: number; // Added unread count to interface
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
            
            // 1. Get IDs of conversations I'm in
            const { data: partData } = await (supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId) as any);
            const ids = (partData || []).map((p: any) => p.conversation_id);
            
            if (ids.length === 0) { setConversations([]); return; }

            // 2. Fetch conversations, the "other" participants, and their profiles
            const { data: convs } = await (supabase.from('conversations').select('*').in('id', ids).order('last_message_at', { ascending: false }) as any);
            const { data: others } = await (supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', ids).neq('user_id', userId) as any);
            
            const otherUserIds = (others || []).map((o: any) => o.user_id);
            const { data: profiles } = await (supabase.from('profiles').select('id, username, full_name').in('id', otherUserIds) as any);

            // 3. FETCH UNREAD COUNTS: Get counts of messages not sent by me and not read
            const { data: unreadData } = await (supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', ids)
                .eq('is_read', false)
                .neq('user_id', userId) as any);

            // Merge everything
            const merged = (convs || []).map((c: any) => {
                const p = (others || []).find((o: any) => o.conversation_id === c.id);
                const prof = (profiles || [])?.find((pr: any) => pr.id === p?.user_id);
                
                // Calculate unread count for this specific conversation
                const count = (unreadData || []).filter((m: any) => m.conversation_id === c.id).length;

                return { 
                    ...c, 
                    display_name: prof?.username || prof?.full_name || "User",
                    unread_count: count 
                };
            });
            
            setConversations(merged);
        } finally { 
            setIsLoading(false); 
        }
    }, [supabase, userId]);

    // Real-time listener for the Navbar and List
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('global-chat-updates')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'messages' 
            }, () => {
                // Refresh list whenever any message is sent or marked as read
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, userId, fetchConversations]);

    const startConversation = async (targetUserId: string) => {
        if (!userId) return null;
    
        try {
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
    
            const { data: newConv, error: convErr } = await (supabase.from('conversations') as any)
                .insert({ last_message_text: 'New conversation started' })
                .select()
                .single();
    
            if (convErr || !newConv) return null;
    
            await (supabase.from('conversation_participants') as any)
                .insert([
                    { conversation_id: newConv.id, user_id: userId },
                    { conversation_id: newConv.id, user_id: targetUserId }
                ]);
    
            await fetchConversations();
            return newConv.id;
        } catch (err) {
            return null;
        }
    };

    useEffect(() => {
        if (!isAuthLoading && userId) fetchConversations();
    }, [isAuthLoading, userId, fetchConversations]);

    return { conversations, isLoading, startConversation, refresh: fetchConversations };
};