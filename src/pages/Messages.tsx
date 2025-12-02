import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../hooks/useSupabase'; 
// *** IMPORTANT: Importing the centralized hook and types ***
import { useConversations, Conversation } from '../hooks/useConversations'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, CornerUpLeft, Loader2 } from 'lucide-react';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'; 

// --- TYPES ---

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string; // Formatted timestamp
}

// Type alias must align with the type exported by useSupabase
type PublicSupabaseClient = SupabaseClient<any, "public">;

// --- UTILITIES ---

/**
 * Helper function to format timestamps (e.g., "10:30 AM", "Yesterday", "Mon")
 */
const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (diffInDays < 1 && date.getDate() === now.getDate()) {
    // Today: show time
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diffInDays < 2) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // Last 7 days: show weekday
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    // More than a week ago: show date
    return date.toLocaleDateString('en-US');
  }
};


// --- SUPABASE DATA FETCHING FUNCTIONS ---

/**
 * Fetches all messages for a specific conversation.
 */
const fetchMessages = async (supabase: PublicSupabaseClient, conversationId: string): Promise<Message[]> => {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  
  // Format timestamps
  const formattedMessages = data.map((msg: any) => ({
    ...msg,
    created_at: formatTimestamp(msg.created_at)
  }));

  return formattedMessages as Message[];
};


// --- CHAT COMPONENTS ---

/**
 * Renders a single message bubble.
 */
const MessageBubble: React.FC<{ message: Message; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const bgColor = isCurrentUser ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800';

    return (
        <div className={`flex ${alignment} mb-3`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow ${bgColor}`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 opacity-75 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {message.created_at}
                </p>
            </div>
        </div>
    );
};

/**
 * Main Chat Window for a selected conversation. 
 */
const ChatWindow: React.FC<{ 
    conversation: Conversation | null; 
    userId: string; 
    onBack: () => void; 
    supabase: PublicSupabaseClient 
}> = ({ conversation, userId, onBack, supabase }) => {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Messages 
  const { data: messages, isLoading: isMessagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: ['messages', conversation?.id],
    queryFn: () => fetchMessages(supabase, conversation?.id || ''),
    enabled: !!conversation?.id, // Only run if conversation ID exists
    // We keep polling as a safety net, although Realtime subscription is the primary mechanism
    refetchInterval: 5000, 
  });

  // 2. Realtime subscription for message updates
  useEffect(() => {
    if (!conversation?.id) return;

    let messageChannel: RealtimeChannel | null = null;
    
    // Subscribe to changes in the 'messages' table for the current conversation
    messageChannel = supabase
      .channel(`message_updates:${conversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${conversation.id}` 
      }, () => {
        // When a new message is inserted, invalidate the query to refetch
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        // Also invalidate conversations query to update the 'last message' summary
        queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      })
      .subscribe();

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [conversation?.id, userId, supabase, queryClient]);

  // 3. Scroll to bottom when messages load/update
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  // 4. Mutation for sending a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      if (!conversation || !userId) throw new Error("Conversation or User ID missing.");

      // 4a. Insert message into the 'messages' table
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          content: messageContent,
        });
      
      // 4b. Update the parent conversation's last message details
      const { error: convUpdateError } = await supabase
        .from('conversations')
        .update({
            last_message_text: messageContent,
            last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
      
      if (messageError) throw new Error(messageError.message);
      if (convUpdateError) console.warn("Could not update conversation last message summary:", convUpdateError.message);
      
      return messageData;
    },
    onSuccess: () => {
      setInputText('');
      // Invalidate queries to trigger refetch via Realtime listener (or polling)
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !sendMessageMutation.isPending) {
        sendMessageMutation.mutate(inputText.trim());
    }
  };
  
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white md:bg-gray-100">
        <MessageSquare className="w-16 h-16 mb-4" />
        <p className="text-xl font-semibold">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-gray-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden mr-2">
            <CornerUpLeft className="w-5 h-5" />
        </Button>
        <Avatar className="mr-3">
          <AvatarFallback>{conversation.display_name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold truncate">{conversation.display_name}</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {isMessagesLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : messagesError ? (
          <div className="text-center text-red-500">Error loading messages.</div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.sender_id === userId} />
          ))
        ) : (
          <div className="text-center text-gray-500 pt-8">No messages yet. Say hello!</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex items-center space-x-3">
          <Input
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="flex-1 rounded-full p-6 text-base focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={sendMessageMutation.isPending || inputText.trim() === ''}
            className="rounded-full h-12 w-12 bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * Sidebar component listing all conversations. 
 */
const ConversationList: React.FC<{ 
    conversations: Conversation[] | undefined; 
    isLoading: boolean; 
    onSelect: (id: string) => void; 
    selectedId: string | null; 
    userId: string; // Added userId for displaying
}> = ({ conversations, isLoading, onSelect, selectedId, userId }) => {
  return (
    <div className="flex flex-col h-full border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
            {/* You could add a search bar here if needed */}
        </div>
        
        {isLoading ? (
            <div className="p-4 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
                <div
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={`flex items-center p-4 cursor-pointer border-b transition-colors 
                                ${selectedId === conv.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50'}`}
                >
                    <Avatar className="mr-3">
                        <AvatarFallback className="bg-indigo-200 text-indigo-700">
                          {conv.display_name.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold truncate text-gray-800">{conv.display_name}</h3>
                            {/* Note: conv.last_message_at is already formatted by the hook */}
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conv.last_message_at}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-0.5">{conv.last_message_text}</p>
                    </div>
                </div>
            ))
        ) : (
            <div className="p-6 text-center text-gray-500">
                <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                <p>No conversations found yet. Start a new chat!</p>
            </div>
        )}
        
        <div className="p-4 border-t mt-auto bg-gray-50">
             <p className="text-xs text-gray-500 truncate">Your User ID: <span className="font-mono text-gray-700">{userId}</span></p>
        </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

const Messages: React.FC<{ userId: string }> = ({ userId }) => {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    // 1. Fetch Conversations using the centralized hook
    const { 
      conversations, 
      isLoading: isConversationsLoading, 
      error: conversationsError 
  } = useConversations();
    // 2. Realtime subscription for conversation list updates (ensures new chats appear instantly)
    useEffect(() => {
      if (!userId) return;

      let conversationChannel: RealtimeChannel | null = null;
      
      // Subscribe to changes in the 'conversations' table
      conversationChannel = supabase
        .channel(`user_conversations:${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
        }, () => {
          // Invalidate the conversations query to trigger a refetch and update the list
          queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
        })
        .subscribe();

      return () => {
        if (conversationChannel) {
          supabase.removeChannel(conversationChannel);
        }
      };
    }, [userId, supabase, queryClient]);
    
    // Handler for selecting a conversation
    const handleSelectConversation = useCallback((id: string) => {
        setSelectedConversationId(id);
        setIsMobileChatOpen(true); // Open chat window on mobile
    }, []);

    // Handler to go back to the list on mobile
    const handleBackToConversations = useCallback(() => {
        setIsMobileChatOpen(false);
    }, []);

    const selectedConversation = conversations?.find(c => c.id === selectedConversationId) || null;
    
    if (conversationsError) {
        console.error("Conversations Error:", conversationsError);
        return <div className="p-4 text-center text-red-500 font-medium">
            Error loading conversation data. Please check RLS policies and network connections.
        </div>;
    }

    // Responsive layout: 
    // On small screens, only one panel is visible at a time based on `isMobileChatOpen`.
    // On medium screens and up, both panels are side-by-side.
    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
            {/* Conversation List (Sidebar) */}
            <div className={`w-full md:w-1/3 lg:w-1/4 flex-shrink-0 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList 
                    conversations={conversations}
                    isLoading={isConversationsLoading}
                    onSelect={handleSelectConversation}
                    selectedId={selectedConversationId}
                    userId={userId} // Pass userId to the list component
                />
            </div>

            {/* Chat Window */}
            <div className={`flex-1 ${isMobileChatOpen ? 'flex' : 'hidden md:flex'} border-l border-gray-200`}>
                <ChatWindow 
                    conversation={selectedConversation} 
                    userId={userId} 
                    onBack={handleBackToConversations} 
                    supabase={supabase}
                />
            </div>
        </div>
    );
};

export default Messages;