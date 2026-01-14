import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Star, MessageCircle, Loader2 } from "lucide-react";

import { useTravelBuddies } from '../hooks/useTravelBuddies'; 
import { useConversations } from '../hooks/useConversations'; 

interface TravelBuddiesPageProps {
  userId: string | undefined; 
}

const TravelBuddies: React.FC<TravelBuddiesPageProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: buddies, isLoading, isError, error } = useTravelBuddies(userId);
  const { startConversation } = useConversations();

  const handleMessageClick = async (buddyUserId: string) => {
    // startConversation now returns the ID of either an existing or new chat
    const conversationId = await startConversation(buddyUserId);
    if (conversationId) {
      navigate('/messages');
    }
  };

  if (!userId) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-gray-500">Please sign in to view travel buddies.</p>
        </div>
      );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500">Finding your travel buddies...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Buddies</h2>
          <p>{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Travel Buddies</h1>
          </div>
          <p className="text-gray-500 text-lg">Your accepted connections and future travel partners.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buddies?.map((buddy) => (
            <Card key={buddy.user_id} className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
              <CardHeader className="text-center pt-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-sm">
                    <AvatarImage src={buddy.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {buddy.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl font-bold">{buddy.username}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      World Traveler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-center text-gray-600 italic px-4">
                  "{buddy.bio || 'Let’s explore the world together!'}"
                </p>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">View Profile</Button>
                  <Button 
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white"
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
          <div className="text-center py-20 border-2 border-dashed rounded-xl mt-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You haven't connected with any buddies yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelBuddies;