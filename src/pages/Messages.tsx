import React, { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../hooks/useAuth';
import DiscoverySidebar from '../components/messaging/DiscoverySidebar';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';

const MessagesPage = () => {
  const { user } = useAuth();
  const { conversations, isLoading, startConversation } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Find the active conversation object to get the buddy's name
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSelectBuddy = async (buddyId: string) => {
    const convId = await startConversation(buddyId);
    if (convId) setActiveConversationId(convId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Column 1: Discovery (Buddy Search) */}
      <div className="w-80 border-r bg-slate-50/50 hidden lg:block">
        <DiscoverySidebar onSelectBuddy={handleSelectBuddy} />
      </div>

      {/* Column 2: Inbox (Active Chats) */}
      <div className="w-80 border-r bg-white">
        <ConversationList 
          conversations={conversations} 
          isLoading={isLoading}
          activeId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      {/* Column 3: The Chat Stage */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <ChatWindow 
          conversationId={activeConversationId} 
          buddyName={activeConversation?.display_name || null}
        />
      </div>
    </div>
  );
};

export default MessagesPage;