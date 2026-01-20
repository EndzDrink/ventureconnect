import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_read: boolean; // Added for notification tracking
}

export const useMessages = (conversationId: string | null) => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Function to mark messages as read
  const markAsRead = async () => {
    if (!conversationId || !user) return;

    const { error } = await (supabase.from('messages') as any)
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .not('user_id', 'eq', user.id); // Only mark messages from others as read

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  };

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

      if (!error && data) {
        setMessages(data);
        // Mark as read immediately after fetching history
        markAsRead();
      }
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
        const newMessage = payload.new as Message;
        setMessages((prev) => [...prev, newMessage]);
        
        // If we are actively looking at the chat, mark new incoming messages as read
        if (newMessage.user_id !== user?.id) {
          markAsRead();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, user?.id]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversationId || !user) return;

    const { error } = await (supabase.from('messages') as any)
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: content.trim(),
        is_read: false // New messages start as unread
      });

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  return { messages, loading, sendMessage };
};