import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Star, MessageCircle, Calendar } from "lucide-react";

// --- Import the Custom Hook and its types ---
// Note: 'ProfileDetails' is imported from the hook file.
import { useTravelBuddies, ProfileDetails } from '../hooks/useTravelBuddies'; 
// ------------------------------------------------


interface TravelBuddiesPageProps {
  // This userId should come from your global Auth context/hook
  userId: string | undefined; 
}


const TravelBuddies: React.FC<TravelBuddiesPageProps> = ({ userId }) => {
  // 1. Use the custom hook to fetch the data
  const { data: buddies, isLoading, isError, error } = useTravelBuddies(userId);

  React.useEffect(() => {
    if (isError) {
      console.error("Query Hook Error:", error);
    }
  }, [isError, error]);
  
  // Use fallbacks for location and age as they are not queried
  const fallbackLocation = "World Traveler";
  const fallbackAge = "N/A";

  // --- Loading States ---

  if (!userId) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 pt-8 text-center text-gray-500">Waiting for user authentication...</div>
        </div>
      );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8 text-center">Finding travel buddies...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8 text-center text-red-500">
          <h2 className="text-2xl font-bold mb-4">Database Query Failed</h2>
          <p className="mb-2">Error loading travel buddies. Check your RLS policy and console logs:</p>
          <pre className="p-3 bg-gray-100 border rounded-md overflow-x-auto text-left text-sm text-red-700">
             {error?.message}
          </pre>
        </div>
      </div>
    );
  }
  
  const buddiesData = buddies || [];

  // --- Main Render ---

  return (
    <div className="min-h-screen bg-background">
      {/* Tailwind setup for demonstration */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        /* Custom Tailwind Configuration for primary color */
        :root {
          --color-primary: 25, 125, 215; /* Blue hue */
          --color-accent: 76, 175, 80; /* Green hue */
        }
        .bg-primary { background-color: rgb(var(--color-primary)); }
        .text-primary { color: rgb(var(--color-primary)); }
        .hover\:bg-primary\/90:hover { background-color: rgba(var(--color-primary), 0.9); }
        .border-primary\/20 { border-color: rgba(var(--color-primary), 0.2); }
      `}</style>
      
      <div className="pt-8 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Travel Buddies</h1>
            </div>
            <p className="text-gray-500 text-lg">
              Connect with fellow travelers and find your perfect travel companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buddiesData.map((buddy) => {
              // We now access buddy details directly
              const id = buddy.user_id; 
              const name = buddy.username ?? 'New Adventurer';
              const location = fallbackLocation; 
              const age = fallbackAge; 
              const rating = buddy.rating ?? 0;
              const trips = buddy.trips ?? 0;
              const bio = buddy.bio ?? 'This traveler has not written a bio yet.';
              const lookingFor = buddy.looking_for ?? 'Any companion';
              const nextTrip = buddy.next_trip ?? 'TBD';

              let interestsArray: string[] = [];
              if (Array.isArray(buddy.interests)) {
                interestsArray = buddy.interests;
              } else if (typeof buddy.interests === 'string' && buddy.interests.length > 0) {
                 try {
                  const parsed = JSON.parse(buddy.interests);
                  if (Array.isArray(parsed)) {
                    interestsArray = parsed;
                  } else {
                    interestsArray = [buddy.interests];
                  }
                 } catch (e) {
                   // Fallback for simple comma-separated string
                   interestsArray = buddy.interests.split(',').map(s => s.trim()).filter(s => s.length > 0);
                 }
              }
                
              const avatarImage = buddy.avatar_url || "";
              
              const nameParts = name.trim().split(/\s+/);
              let avatarFallback = '';
              if (nameParts.length > 1) {
                  avatarFallback = nameParts[0][0] + nameParts[nameParts.length - 1][0];
              } else if (name.length > 1) {
                  avatarFallback = name.slice(0, 2);
              } else {
                  avatarFallback = '?';
              }


              return (
                <Card key={id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="text-center pt-6">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                        <AvatarImage src={avatarImage} alt={name} />
                        <AvatarFallback className="text-xl bg-primary text-white font-semibold">
                          {avatarFallback.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="mt-2">
                        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 justify-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 text-primary" />
                          {location}
                          <span className="text-gray-300 mx-1">•</span>
                          {age} 
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 mt-4 border-b pb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {trips} trips
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-center italic text-gray-700">{bio}</p>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary text-center">Interests</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {interestsArray.length > 0 ? (
                          interestsArray.slice(0, 4).map((interest, index) => ( // Show max 4 interests
                            <Badge 
                              key={index} 
                              className="text-xs bg-gray-200 text-gray-800 hover:bg-gray-300"
                            >
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No interests listed</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t pt-4">
                      <div className="text-sm flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Looking for:</span>
                        <span className="text-gray-500 font-medium">{lookingFor}</span>
                      </div>
                      <div className="text-sm flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Next trip:</span>
                        <div className="flex items-center gap-1 text-gray-500 font-medium">
                            <Calendar className="h-3 w-3" />
                            {nextTrip}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/5">
                        View Profile
                      </Button>
                      <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white">
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Show a message if no buddies are found */}
          {buddiesData.length === 0 && !isLoading && (
            <div className="text-center mt-10 p-10 text-gray-500 border border-dashed rounded-xl">
              <Users className="h-6 w-6 mx-auto mb-3" />
              <p>You don't have any **accepted** travel buddies yet. Find one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelBuddies;