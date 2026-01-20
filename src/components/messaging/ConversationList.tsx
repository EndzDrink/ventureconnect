import React from 'react';
import { Conversation } from '../../hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeId: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  isLoading, 
  activeId, 
  onSelectConversation 
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-slate-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold">Messages</h2>
        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-medium">
          {conversations.length} Active
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-400">No active conversations yet.</p>
            <p className="text-xs text-slate-300 mt-1">Start a chat from the discovery panel!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`group flex flex-col p-4 border-b cursor-pointer transition-all relative ${
                activeId === conv.id 
                  ? 'bg-blue-50/50' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Active Indicator Bar */}
              {activeId === conv.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
              )}

              <div className="flex justify-between items-baseline mb-1">
                <span className={`text-sm truncate ${activeId === conv.id ? 'font-bold text-blue-900' : 'font-semibold text-slate-700'}`}>
                  {conv.display_name}
                </span>
                {conv.last_message_at && (
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <p className={`text-xs truncate ${activeId === conv.id ? 'text-blue-700/70' : 'text-slate-500'}`}>
                {conv.last_message_text || "No messages yet"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;