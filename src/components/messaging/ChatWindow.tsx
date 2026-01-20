import React, { useState, useEffect, useRef } from 'react';
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  conversationId: string | null;
  buddyName: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, buddyName }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText("");
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Your Adventure Awaits</p>
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header showing the dynamic Buddy Name */}
      <div className="h-16 border-b bg-white flex items-center px-6 shadow-sm">
        <span className="font-bold text-slate-700">
         {buddyName || 'Buddy'}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 text-xs">Loading messages...</p>
        ) : (
          messages.map((m) => (
            <MessageBubble 
            key={m.id} 
            content={m.content} 
            isMe={m.user_id === user?.id} 
            timestamp={m.created_at}
            />
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <form className="flex gap-2 max-w-4xl mx-auto" onSubmit={handleSend}>
          <Input 
            placeholder="Write a message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;