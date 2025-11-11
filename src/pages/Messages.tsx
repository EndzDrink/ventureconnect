import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Assuming relative path is resolved or adjusted
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, MessageSquare, CornerUpLeft, MoreVertical, X } from 'lucide-react';

// --- MOCK DATA STRUCTURES ---

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

// Mock Data
const mockConversations: Conversation[] = [
  { id: 'c1', name: 'Alice, Event Organizer', lastMessage: 'See you at the networking event tomorrow!', timestamp: '10:30 AM', avatarUrl: 'https://placehold.co/150x150/007bff/ffffff?text=AL', unreadCount: 2 },
  { id: 'c2', name: 'Bob, Travel Buddy', lastMessage: 'Did you finalize the flight details?', timestamp: 'Yesterday', avatarUrl: 'https://placehold.co/150x150/28a745/ffffff?text=BO', unreadCount: 0 },
  { id: 'c3', name: 'VentureConnect Team', lastMessage: 'Your deal has been approved.', timestamp: 'Mon', avatarUrl: 'https://placehold.co/150x150/6c757d/ffffff?text=VC', unreadCount: 5 },
  { id: 'c4', name: 'Featured Partner Inc.', lastMessage: 'Here is the new discount code.', timestamp: '3 days ago', avatarUrl: 'https://placehold.co/150x150/ffc107/333333?text=FP', unreadCount: 0 },
];

const mockMessages: Record<string, Message[]> = {
  'c1': [
    { id: 'm1', senderId: 'user', text: 'Thanks for organizing! Looking forward to it.', timestamp: '10:28 AM' },
    { id: 'm2', senderId: 'c1', text: 'See you at the networking event tomorrow!', timestamp: '10:30 AM' },
  ],
  'c2': [
    { id: 'm3', senderId: 'c2', text: 'Did you finalize the flight details?', timestamp: 'Yesterday' },
    { id: 'm4', senderId: 'user', text: 'Almost, checking the hotel now.', timestamp: 'Yesterday' },
  ],
  // Placeholder for other chats
  'c3': [{ id: 'm5', senderId: 'c3', text: 'Your deal has been approved.', timestamp: 'Mon' }],
  'c4': [{ id: 'm6', senderId: 'c4', text: 'Here is the new discount code.', timestamp: '3 days ago' }],
};

// --- CHAT COMPONENTS ---

/**
 * Renders a single message bubble.
 */
const MessageBubble: React.FC<{ message: Message; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const bubbleClass = isCurrentUser
    ? 'bg-primary text-primary-foreground rounded-br-none ml-auto'
    : 'bg-muted text-foreground rounded-tl-none mr-auto';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md ${bubbleClass}`}>
        <p className="text-sm break-words">{message.text}</p>
        <span className={`block text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

/**
 * Main Chat Window for a selected conversation.
 */
const ChatWindow: React.FC<{ conversation: Conversation | null; userId: string; onBack: () => void }> = ({ conversation, userId, onBack }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the latest message whenever messages change or conversation is selected
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Use mock messages for the currently selected conversation
  const messages = conversation ? mockMessages[conversation.id] || [] : [];
  
  useEffect(() => {
    scrollToBottom();
  }, [conversation, messages]);

  const handleSend = () => {
    if (inputText.trim() && conversation) {
      // In a real app, this would be a Firestore or WebSocket write operation.
      console.log(`Sending to ${conversation.id}: ${inputText.trim()}`);
      setInputText('');
      // For mock data, we can pretend to add the message
      // Note: This won't update the displayed list since messages is hardcoded mockMessages
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 text-primary/50" />
        <h2 className="text-xl font-semibold mb-2">Select a Conversation</h2>
        <p>Start chatting with other users or partners.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-card shadow-lg xl:shadow-none">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="xl:hidden mr-2">
          <CornerUpLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
          <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold truncate">{conversation.name}</h3>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            isCurrentUser={message.senderId === 'user'} // Assuming 'user' is the identifier for the current user
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            className="flex-1 pr-10"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button size="icon" onClick={handleSend} disabled={!inputText.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Sidebar component listing all conversations.
 */
const ConversationList: React.FC<{ 
  conversations: Conversation[]; 
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ conversations, onSelect, selectedId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">Messages</h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((c) => (
            <div
              key={c.id}
              className={`flex items-center p-3 cursor-pointer border-b transition-colors hover:bg-muted ${
                selectedId === c.id ? 'bg-muted border-l-4 border-primary' : ''
              }`}
              onClick={() => onSelect(c.id)}
            >
              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                <AvatarImage src={c.avatarUrl} alt={c.name} />
                <AvatarFallback>{c.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate text-sm">{c.name}</h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{c.timestamp}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-2 flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-muted-foreground">No conversations found.</p>
        )}
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

const Messages: React.FC<{ userId: string }> = ({ userId }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(mockConversations[0]?.id || null);
  const selectedConversation = mockConversations.find(c => c.id === selectedConversationId) || null;
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Handler for selecting a conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setIsMobileChatOpen(true); // Open chat view on mobile
  };

  // Handler to close the chat window on mobile and show the list
  const handleBackToList = () => {
    setIsMobileChatOpen(false);
  };
  
  // Reset mobile chat view if the screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) { // xl breakpoint
        setIsMobileChatOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container mx-auto p-0 xl:p-6 h-[calc(100vh-64px)] overflow-hidden">
      <Card className="h-full flex overflow-hidden border-none xl:border">
        {/* Conversation List (Sidebar) */}
        <div 
          className={`h-full w-full xl:w-80 flex-shrink-0 transition-transform duration-300 ease-in-out ${
            isMobileChatOpen ? 'hidden xl:block' : 'block'
          }`}
        >
          <ConversationList
            conversations={mockConversations}
            onSelect={handleSelectConversation}
            selectedId={selectedConversationId}
          />
        </div>

        {/* Chat Window */}
        <div 
          className={`flex-1 h-full transition-transform duration-300 ease-in-out ${
            isMobileChatOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0 hidden xl:flex'
          }`}
        >
          <ChatWindow
            conversation={selectedConversation}
            userId={userId}
            onBack={handleBackToList}
          />
        </div>
      </Card>
    </div>
  );
};

export default Messages;