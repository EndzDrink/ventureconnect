import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Bot, Loader2, Zap } from 'lucide-react';

// -----------------------------------------------------------------------------
// API AND SUPABASE CONFIG
// -----------------------------------------------------------------------------

// Gemini API Configuration
const GEMINI_API_KEY = ""; // Placeholder. Canvas will inject the real key.
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// Supabase Mock Configuration (as used in previous iteration)
const createClient = (url: string, key: string) => {
    console.log(`Supabase Client Initialized: ${url}`);
    return {
        from: (tableName: string) => ({
            select: (columns: string) => ({
                order: (column: string, config: any) => ({
                    limit: (n: number) => {
                        return Promise.resolve({ 
                            data: [
                                { id: 'mock-1', content: "Hello! I'm your virtual support assistant. I can help with information about your account, features, and troubleshooting.", user_id: 'ai', created_at: new Date(Date.now() - 60000).toISOString(), is_ai_response: true },
                            ], 
                            error: null 
                        });
                    }
                })
            }),
            insert: (data: any) => {
                const inserted = { id: Math.random().toString(36).substring(2, 9), ...data[0], created_at: new Date().toISOString() };
                console.log("Supabase INSERT:", inserted);
                return Promise.resolve({ data: [inserted], error: null });
            },
            on: (event: string, config: (payload: any) => void) => {
                console.log(`Supabase Realtime Subscribing to: ${tableName} for event: ${event}`);
                return {
                    subscribe: () => { 
                        console.log("Subscription established (Mock)");
                        return { unsubscribe: () => console.log("Subscription unsubscribed (Mock)") };
                    }
                };
            }
        }),
        auth: {
            signInAnonymously: () => {
                const mockUser = { uid: `user-${Math.random().toString(36).substring(2, 8)}` };
                return Promise.resolve({ user: mockUser, session: {} });
            },
        },
    };
};

const supabaseUrl = "https://ilidtqlbkwyoxoowyggl.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaWR0cWxia3d5b3hvb3d5Z2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE3NDIsImV4cCI6MjA3MTc3Nzc0Mn0.hvBhSWEJuu8rXBwm7d6-h0ywNULDrh8J1td4_WGHOgo"; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

interface Message {
    id: string;
    content: string;
    user_id: string; // auth.users (id) or 'ai'
    created_at: string;
    is_ai_response: boolean;
}

// -----------------------------------------------------------------------------
// GEMINI API HELPER FUNCTION
// -----------------------------------------------------------------------------

const callGeminiAPI = async (userPrompt: string): Promise<string> => {
    const systemPrompt = "You are a friendly, concise, and helpful AI Support Assistant. Respond to the user's query clearly and professionally in a maximum of two paragraphs. Use Google Search grounding to ensure accuracy.";

    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        // Use Google Search for grounding to provide up-to-date and relevant answers
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    // Exponential backoff retry logic
    const maxRetries = 3;
    let lastError = new Error("API call failed after max retries.");

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorBody.error?.message}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate?.content?.parts?.[0]?.text) {
                return candidate.content.parts[0].text;
            } else {
                throw new Error("Gemini response was empty or malformed.");
            }

        } catch (error) {
            lastError = error as Error;
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // Fallback message after all retries fail
    console.error("Final API Failure:", lastError);
    return "I apologize, but I am currently unable to process your request. Please try again later.";
};


// -----------------------------------------------------------------------------
// CHAT COMPONENTS
// -----------------------------------------------------------------------------

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start mb-4">
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 mt-auto mb-2 shrink-0">
            <Bot className="h-4 w-4 text-gray-600 animate-pulse" />
        </div>
        <div className="bg-gray-100 p-3 rounded-xl rounded-bl-none shadow-md flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
            <span className="text-gray-700 italic">AI is responding...</span>
        </div>
    </div>
);

const ChatBubble: React.FC<{ message: Message; currentUserId: string }> = ({ message, currentUserId }) => {
    const isCurrentUser = message.user_id === currentUserId;
    const isAi = message.is_ai_response;
    
    // Base styles for the bubble
    let bubbleClass = "max-w-[80%] p-3 rounded-xl shadow-md mb-3 whitespace-pre-wrap transition-all duration-300";
    let containerClass = "flex";
    
    if (isAi) {
        bubbleClass += " bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200";
        containerClass += " justify-start";
    } else if (isCurrentUser) {
        // User messages (right-aligned, primary color)
        bubbleClass += " bg-primary text-white rounded-br-none";
        containerClass += " justify-end";
    } else {
        // Other user messages (left-aligned, neutral)
        bubbleClass += " bg-gray-200 text-gray-800 rounded-bl-none";
        containerClass += " justify-start";
    }

    const AvatarIcon = isAi ? Bot : User;

    return (
        <div className={containerClass}>
            {!isCurrentUser && (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 mt-auto mb-2 shrink-0">
                    <AvatarIcon className="h-4 w-4 text-gray-600" />
                </div>
            )}
            <div className={bubbleClass}>
                {message.content}
                <div className={`text-[10px] opacity-60 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            {isCurrentUser && (
                 <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ml-2 mt-auto mb-2 shrink-0">
                    <User className="h-4 w-4 text-primary" />
                </div>
            )}
        </div>
    );
};

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------

export default function ChatApp() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isAiResponding, setIsAiResponding] = useState(false); // New state for AI typing indicator
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom of the chat window
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // --- 1. AUTHENTICATION & INITIALIZATION ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { user } = await supabase.auth.signInAnonymously();
                if (user) {
                    setUserId(user.uid);
                    console.log("User signed in anonymously:", user.uid);
                } else {
                    setUserId('default-mock-user');
                }
            } catch (error) {
                console.error("Authentication Error:", error);
                setUserId('error-user'); 
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();
    }, []);

    // --- 2. FETCH & SUBSCRIBE TO MESSAGES ---
    useEffect(() => {
        if (!userId) return;

        // Function to fetch initial messages
        const fetchInitialMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50); 

            if (error) {
                console.error("Error fetching messages:", error);
                return;
            }
            
            const sortedData = (data as Message[] || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setMessages(sortedData as Message[]);
            scrollToBottom();
        };

        // Function to handle real-time inserts
        const handleNewMessage = (payload: any) => {
            const newMessage = payload.new as Message;
            console.log("New Message Received (Realtime):", newMessage);

            // Hide the typing indicator if the new message is an AI response
            if (newMessage.is_ai_response) {
                 setIsAiResponding(false);
            }

            setMessages((prevMessages) => {
                // Prevent duplicates if the message was sent by this client
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            setTimeout(scrollToBottom, 0); 
        };

        fetchInitialMessages();

        // Real-time subscription setup
        const channel = supabase
            .from('messages')
            .on('INSERT', handleNewMessage)
            .subscribe();

        // Cleanup function for the subscription
        return () => {
            if (channel && typeof channel.unsubscribe === 'function') {
                channel.unsubscribe();
            }
        };

    }, [userId, scrollToBottom]); 

    // --- 3. SEND MESSAGE HANDLER ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || isSending || isAiResponding) return;

        setIsSending(true);
        const userMessageContent = newMessage.trim();
        setNewMessage(''); // Clear input immediately for better UX

        // --- PHASE 1: Send User Message to Supabase ---
        const { error: userError, data: userData } = await supabase
            .from('messages')
            .insert([
                { 
                    content: userMessageContent,
                    user_id: userId,
                    is_ai_response: false,
                }
            ]);

        if (userError) {
            console.error("Error sending user message:", userError);
            setIsSending(false);
            return;
        }

        // --- PHASE 2: Call Gemini API and wait for response ---
        setIsAiResponding(true); // Show typing indicator

        const aiResponseText = await callGeminiAPI(userMessageContent);

        // --- PHASE 3: Send AI Response to Supabase ---
        // The real-time listener will pick this up and display it.
        const { error: aiError } = await supabase
            .from('messages')
            .insert([
                { 
                    content: aiResponseText,
                    user_id: 'ai', // Use 'ai' or a specific bot ID
                    is_ai_response: true,
                }
            ]);

        if (aiError) {
            console.error("Error sending AI response:", aiError);
        }
        
        setIsSending(false);
        // setIsAiResponding is handled by the real-time listener when the message appears
    };

    // --- RENDER LOGIC ---

    if (authLoading) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-gray-600">Initializing chat and user session...</p>
            </div>
        );
    }
    
    // Styling constants
    const primaryColor = 'rgb(25, 125, 215)';

    return (
        <div 
            className="min-h-screen bg-gray-100 flex flex-col p-4 font-sans" 
            style={{ '--color-primary': primaryColor } as React.CSSProperties}
        >
            <script src="https://cdn.tailwindcss.com"></script>
            <style>{`
                /* Custom Tailwind Configuration for primary color */
                .bg-primary { background-color: var(--color-primary); }
                .text-primary { color: var(--color-primary); }
                .hover\\:bg-primary\\/90:hover { background-color: rgba(25, 125, 215, 0.9); }
                
                /* Ensure chat container scales correctly */
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    max-height: calc(100vh - 32px); /* Adjust for padding */
                    overflow: hidden;
                    background-color: white;
                    border-radius: 0.75rem; /* rounded-xl */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-xl */
                }
                
                /* Hide scrollbar but allow scrolling */
                .chat-history::-webkit-scrollbar {
                    display: none;
                }
                .chat-history {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>

            <div className="chat-container max-w-4xl mx-auto w-full">
                
                {/* Header */}
                <header className="p-4 border-b bg-gray-50 flex items-center justify-between rounded-t-xl">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" /> AI Support Chat
                    </h1>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User ID: <span className="font-mono text-primary truncate max-w-[100px] sm:max-w-none">{userId}</span>
                    </div>
                </header>

                {/* Message History */}
                <div className="flex-grow p-4 overflow-y-auto chat-history space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <Zap className="h-6 w-6 mx-auto mb-2" />
                            <p>Start the conversation! Send your first message.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <ChatBubble key={msg.id} message={msg} currentUserId={userId!} />
                        ))
                    )}
                    {/* AI Typing Indicator */}
                    {isAiResponding && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                        disabled={isSending || !userId || isAiResponding}
                    />
                    <button
                        type="submit"
                        className={`p-3 rounded-lg text-white transition-all duration-200 flex items-center justify-center ${
                            (!newMessage.trim() || isSending || isAiResponding) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                        }`}
                        disabled={!newMessage.trim() || isSending || !userId || isAiResponding}
                    >
                        {(isSending || isAiResponding) ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Send className="h-6 w-6" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}