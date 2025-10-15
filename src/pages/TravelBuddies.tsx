import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Star, MessageCircle, Calendar } from "lucide-react"; // Added Calendar icon

// 1. Import Supabase Client and React Query
import { useQuery } from '@tanstack/react-query';
// FIX: Using the corrected relative path for Supabase client
import { supabase } from '@/integrations/supabase/client'; 

// 2. Define the TypeScript interface for a Travel Buddy
interface Buddy {
  id: string;
  name: string; // The user's full name (or alias)
  location: string;
  age: number;
  rating: number;
  trips: number;
  // We assume interests is stored as a JSONB column in Supabase
  interests: string[] | string; 
  bio: string;
  avatar_url: string | null; 
  looking_for: string; 
  next_trip: string;   
}

// NEW: Interface for the component props (to satisfy ProtectedRoute)
interface TravelBuddiesPageProps {
  userId: string; // Required by ProtectedRoute
}


// 3. Define the data fetching function
const fetchTravelBuddies = async (): Promise<Buddy[]> => {
  const { data, error } = await supabase
    // Cast to 'any' to bypass the persistent TypeScript error (2769)
    .from('travel_buddies' as any)
    .select(`
      id, 
      name, 
      location, 
      age, 
      rating, 
      trips, 
      interests, 
      bio, 
      avatar_url, 
      looking_for, 
      next_trip
    `)
    .order('rating', { ascending: false }); // Order by rating descending

  if (error) {
    console.error("Supabase Buddy Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // Cast data to 'unknown' then to Buddy[] to resolve the strict conversion error (2352)
  return data as unknown as Buddy[];
};


// FIX: Accept the userId prop and remove the Navbar
const TravelBuddies: React.FC<TravelBuddiesPageProps> = ({ userId }) => {
  // 4. Use React Query to fetch the data
  const { data: buddies, isLoading, isError, error } = useQuery({
    queryKey: ['travelBuddies'],
    queryFn: fetchTravelBuddies,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Adjusted padding after Navbar removal */}
        <div className="container mx-auto px-4 py-8 pt-8 text-center">Finding travel buddies...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        {/* Adjusted padding after Navbar removal */}
        <div className="container mx-auto px-4 py-8 pt-8 text-center text-red-500">
          Error loading travel buddies: {error?.message}
        </div>
      </div>
    );
  }
  
  // Use the fetched data
  const buddiesData = buddies || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar removed as it's handled by the layout */}
      
      <div className="pt-8 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Travel Buddies</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Connect with fellow travelers and find your perfect travel companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buddiesData.map((buddy) => {
              // Safely handle interests, which could be an array or a JSON string
              let interestsArray: string[] = [];
              if (Array.isArray(buddy.interests)) {
                interestsArray = buddy.interests;
              } else if (typeof buddy.interests === 'string') {
                try {
                  interestsArray = JSON.parse(buddy.interests);
                } catch (e) {
                  // Fallback if parsing fails
                  interestsArray = [buddy.interests];
                }
              }
                
              const avatarImage = buddy.avatar_url || "";
              const nameParts = buddy.name.split(' ');
              const avatarFallback = nameParts.length > 1 
                ? nameParts[0][0] + nameParts[1][0] 
                : buddy.name.slice(0, 2);

              return (
                <Card key={buddy.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="text-center pt-6">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                        <AvatarImage src={avatarImage} alt={buddy.name} />
                        <AvatarFallback className="text-xl bg-primary text-primary-foreground font-semibold">
                          {avatarFallback.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="mt-2">
                        <CardTitle className="text-2xl font-bold">{buddy.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 justify-center mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          {buddy.location}
                          <span className="text-border mx-1">•</span>
                          {buddy.age} years old
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 mt-4 border-b pb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">{buddy.rating}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {buddy.trips} trips
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-center italic text-card-foreground/80">{buddy.bio}</p>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Interests</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {interestsArray.map((interest, index) => (
                          <Badge 
                            key={index} 
                            variant="default" 
                            className="text-xs bg-accent text-accent-foreground hover:bg-accent/80"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t pt-4">
                      <div className="text-sm flex justify-between items-center">
                        <span className="font-semibold text-card-foreground">Looking for:</span>
                        <span className="text-muted-foreground font-medium">{buddy.looking_for}</span>
                      </div>
                      <div className="text-sm flex justify-between items-center">
                        <span className="font-semibold text-card-foreground">Next trip:</span>
                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <Calendar className="h-3 w-3" />
                            {buddy.next_trip}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1">
                        View Profile
                      </Button>
                      <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90">
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
            <div className="text-center mt-10 p-10 text-muted-foreground border border-dashed rounded-xl">
              <Users className="h-6 w-6 mx-auto mb-3" />
              <p>No travel buddies found. Be the first to list yourself!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelBuddies;
