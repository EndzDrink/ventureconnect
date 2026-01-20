import React from 'react';

interface MessageBubbleProps {
  content: string;
  isMe: boolean;
  timestamp?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content, isMe, timestamp }) => {
  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
        isMe 
          ? 'bg-blue-600 text-white rounded-tr-none' 
          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
      }`}>
        <p>{content}</p>
        {timestamp && (
          <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;