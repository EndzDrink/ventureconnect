import React, { useState, useRef } from 'react';
import { useSupabase } from '../hooks/useSupabase'; 
import { useConversations } from '../hooks/useConversations'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, Search, UserPlus, Loader2 } from 'lucide-react';

const Messages: React.FC<{ userId: string }> = ({ userId }) => {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [inputText, setInputText] = useState('');
    
    const { conversations, isLoading, startConversation } = useConversations();
    const activeConv = conversations?.find(c => c.id === selectedId) || null;

    // Search for existing users in the 'profiles' table
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const { data } = await supabase.from('profiles')
            .select('id, username')
            .ilike('username', `%${searchQuery}%`)
            .neq('id', userId)
            .limit(5);
        setSearchResults(data || []);
        setIsSearching(false);
    };

    const handleCreateChat = async (targetId: string) => {
        const newChatId = await startConversation(targetId);
        if (newChatId) {
            setSelectedId(newChatId);
            setSearchResults([]);
            setSearchQuery('');
        }
    };

    const { data: messages } = useQuery({
        queryKey: ['messages', selectedId],
        queryFn: async () => {
            const { data } = await supabase.from('messages').select('*').eq('conversation_id', selectedId).order('created_at', { ascending: true });
            return (data as any[]) || [];
        },
        enabled: !!selectedId,
    });

    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            if (!selectedId) return;
            await (supabase.from('messages') as any).insert({ conversation_id: selectedId, sender_id: userId, content });
            await (supabase.from('conversations') as any).update({ last_message_text: content, last_message_at: new Date().toISOString() }).eq('id', selectedId);
        },
        onSuccess: () => {
            setInputText('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
        }
    });

    return (
        <div className="flex h-screen bg-white pt-4">
            {/* SIDEBAR */}
            <div className="w-80 border-r flex flex-col">
                <div className="p-4 border-b space-y-2">
                    <h2 className="font-bold text-xl">Chats</h2>
                    <div className="flex gap-2">
                        <Input placeholder="Find user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <Button size="icon" onClick={handleSearch}>{isSearching ? <Loader2 className="animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 border rounded-md bg-slate-50 p-2 shadow-sm">
                            {searchResults.map(u => (
                                <div key={u.id} className="flex justify-between items-center p-1 text-sm border-b last:border-0">
                                    <span>{u.username}</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleCreateChat(u.id)}><UserPlus className="h-3 w-3" /></Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(c => (
                        <div key={c.id} onClick={() => setSelectedId(c.id)}
                             className={`p-4 border-b cursor-pointer hover:bg-slate-50 ${selectedId === c.id ? 'bg-indigo-50' : ''}`}>
                            <p className="font-semibold">{c.display_name}</p>
                            <p className="text-xs text-gray-500 truncate">{c.last_message_text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div className="flex-1 flex flex-col">
                {activeConv ? (
                    <>
                        <div className="p-4 border-b bg-slate-50 font-bold">{activeConv.display_name}</div>
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {messages?.map((m: any) => (
                                <div key={m.id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'} mb-2`}>
                                    <div className={`p-2 rounded-lg max-w-xs ${m.sender_id === userId ? 'bg-indigo-500 text-white' : 'bg-white border'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form className="p-4 border-t flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage.mutate(inputText); }}>
                            <Input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type a message..." />
                            <Button type="submit" disabled={sendMessage.isPending}><Send className="h-4 w-4" /></Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p>Search for a user to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;