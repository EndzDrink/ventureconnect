import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, MessageCircle, Loader2 } from "lucide-react";

// --- Hooks ---
import { useTravelBuddies } from '../hooks/useTravelBuddies'; 
import { useConversations } from '../hooks/useConversations'; 

interface TravelBuddiesPageProps {
  userId: string | undefined; 
}

const TravelBuddies: React.FC<TravelBuddiesPageProps> = ({ userId }) => {
  const navigate = useNavigate();
  
  // 1. Fetch data using our custom hooks
  const { data: buddies, isLoading, isError, error } = useTravelBuddies(userId);
  const { startConversation } = useConversations();

  // 2. Handle the Message button click
  const handleMessageClick = async (buddyUserId: string) => {
    try {
      // This calls the "Check if Exists" logic in your hook
      const conversationId = await startConversation(buddyUserId);
      
      if (conversationId) {
        // Redirect to the updated Messages page
        navigate('/messages');
      }
    } catch (err) {
      console.error("Failed to start or find conversation:", err);
    }
  };

  // --- UI States ---

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-gray-500">Please sign in to view your travel buddies.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Loading your buddies...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
        <p className="bg-red-50 p-4 rounded-md border border-red-200 inline-block">
          {error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Travel Buddies</h1>
          </div>
          <p className="text-gray-500 text-lg">
            Connect with your accepted partners and plan your next trip.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buddies?.map((buddy) => (
            <Card key={buddy.user_id} className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border-primary/10">
              <CardHeader className="text-center pt-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={buddy.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-white text-lg font-bold">
                      {buddy.username?.slice(0, 2).toUpperCase() || "TR"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold">{buddy.username || 'Traveler'}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      World Explorer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-center text-gray-600 italic px-2">
                  "{buddy.bio || 'Ready for a new adventure!'}"
                </p>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 text-xs sm:text-sm">
                    View Profile
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm"
                    onClick={() => handleMessageClick(buddy.user_id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!buddies || buddies.length === 0) && (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl mt-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No buddies found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Once your buddy requests are accepted, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelBuddies;