import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, MessageCircle, Loader2, ChevronDown, ChevronUp, Star } from "lucide-react";

// --- Hooks ---
import { useTravelBuddies } from '../hooks/useTravelBuddies'; 
import { useConversations } from '../hooks/useConversations'; 

// --- Types ---

// TEMPORARY FIX: Manually extending the buddy type to include the background image field
// until the database types are regenerated.
type EnhancedBuddy = any & {
  bg_image_url?: string | null;
  bio?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  user_id: string;
};

interface TravelBuddiesPageProps {
  userId: string | undefined; 
}

const TravelBuddies: React.FC<TravelBuddiesPageProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // 1. Fetch data
  const { data: rawBuddies, isLoading, isError, error } = useTravelBuddies(userId);
  const { startConversation } = useConversations();

  // Cast buddies to our enhanced type to fix the red squiggly lines
  const buddies = rawBuddies as EnhancedBuddy[] | undefined;

  const handleMessageClick = async (buddyUserId: string) => {
    try {
      const conversationId = await startConversation(buddyUserId);
      if (conversationId) navigate('/messages');
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!userId) return <div className="min-h-screen bg-background flex items-center justify-center p-4"><p className="text-gray-500">Please sign in.</p></div>;
  if (isLoading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-gray-500 font-medium">Loading...</p></div>;
  if (isError) return <div className="min-h-screen bg-background p-8 text-center text-red-500"><h2 className="text-2xl font-bold mb-4">Error</h2><p>{error?.message}</p></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Travel Buddies</h1>
          </div>
          <p className="text-gray-500 text-lg">Connect with your accepted partners and plan your next trip.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buddies?.map((buddy) => {
            const isExpanded = expandedId === buddy.user_id;
            
            // Background Image Logic
            const cardBgStyle = buddy.bg_image_url 
              ? { backgroundImage: `url(${buddy.bg_image_url})` } 
              : { background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)' };

            return (
              <Card key={buddy.user_id} className="group overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-primary/10 bg-white rounded-[2rem]">
                
                {/* --- BACKGROUND IMAGE HEADER --- */}
                <div 
                  className="h-24 w-full bg-cover bg-center relative transition-transform duration-500 group-hover:scale-105"
                  style={cardBgStyle}
                >
                  <div className="absolute inset-0 bg-black/5" />
                </div>

                <CardHeader className="text-center -mt-12 relative z-10 pt-0 pb-2">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                      <AvatarImage src={buddy.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-white text-xl font-bold">
                        {buddy.username?.slice(0, 2).toUpperCase() || "TR"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">{buddy.username || 'Traveler'}</CardTitle>
                      <CardDescription className="flex items-center justify-center gap-1 mt-1 font-medium text-primary">
                        <MapPin className="h-3.5 w-3.5" /> World Explorer
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-center text-slate-600 italic px-4 leading-relaxed">
                    "{buddy.bio || 'Ready for a new adventure!'}"
                  </p>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="flex justify-around items-center bg-slate-50 py-3 rounded-2xl">
                        <div className="text-center">
                          <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Trips</p>
                          <p className="text-sm font-black text-slate-900">12</p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200" />
                        <div className="text-center">
                          <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Rating</p>
                          <div className="flex items-center justify-center gap-0.5 text-sm font-black text-slate-900">
                            4.9 <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => navigate(`/profile/${buddy.user_id}`)}>
                        Profile
                      </Button>
                      <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md" onClick={() => handleMessageClick(buddy.user_id)}>
                        <MessageCircle className="h-4 w-4" /> Message
                      </Button>
                    </div>
                    <button onClick={() => toggleExpand(buddy.user_id)} className="w-full py-1 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                      {isExpanded ? <>Less Details <ChevronUp className="h-3 w-3" /></> : <>More Details <ChevronDown className="h-3 w-3" /></>}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TravelBuddies;