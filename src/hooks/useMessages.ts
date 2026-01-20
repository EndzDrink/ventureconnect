import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth';

export interface Message {
    id: string;
    conversation_id: string;
    user_id: string; // Changed from sender_id
    content: string;
    created_at: string;
  }

export const useMessages = (conversationId: string | null) => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await (supabase.from('messages') as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversationId || !user) return;

    const { error } = await (supabase.from('messages') as any)
        .insert({
            conversation_id: conversationId,
            user_id: user.id, // Changed from sender_id to user_id to fix the 23502 error
            content: content.trim()
        });

    if (error) {
        console.error("Error sending message:", error);
    }
};
  return { messages, loading, sendMessage };
};