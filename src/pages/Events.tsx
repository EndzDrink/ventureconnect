import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

// 1. Import Supabase Client and React Query
import { useQuery } from '@tanstack/react-query';
// Keeping the relative path for robustness against alias errors
import { supabase } from '../integrations/supabase/client'; 

// --- Types ---

// Define the TypeScript interface for an Event
interface Event {
  id: string; 
  title: string;
  description: string;
  date: string;          // Storing date as string for simple display (e.g., "March 22-24, 2024")
  time: string;          // Storing time as string (e.g., "6:00 AM")
  location: string;
  participants: number;  // Current number of people who joined
  max_participants: number; // Renamed to max_participants to fit common snake_case DB style
  category: string;
  difficulty: string;
  price: string;         // Storing price as string (e.g., "ZAR85")
}

// NEW: Interface for the component props (to satisfy ProtectedRoute)
interface EventsPageProps {
  userId: string; // Required by ProtectedRoute, even if not used here
}


// --- Data Fetching ---

// Define the data fetching function
const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    // Cast to 'any' to bypass the persistent TypeScript error (2769)
    .from('events' as any)
    .select(`
      id, 
      title, 
      description, 
      date, 
      time, 
      location, 
      participants, 
      max_participants, 
      category, 
      difficulty, 
      price
    `)
    .order('date', { ascending: true }); 

  if (error) {
    console.error("Supabase Event Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // Cast data to 'unknown' then to Event[] to resolve the strict conversion error (2352)
  return data as unknown as Event[];
};

// --- Component ---

const Events: React.FC<EventsPageProps> = ({ userId }) => { // Accept the userId prop
  // 4. Use React Query to fetch the data
  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  // FIX: Removed redundant Navbar component
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8 text-center">Loading events...</div>
      </div>
    );
  }

  // FIX: Removed redundant Navbar component
  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8 text-center text-red-500">
          Error loading events: {error?.message}
        </div>
      </div>
    );
  }
  
  // Use the fetched data
  const eventsData = events || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar is now handled by the NavLayout wrapper in App.tsx, so it's removed here */}
      
      <div className="pt-8 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Travel Events</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Join exciting travel events and meet like-minded adventurers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsData.map((event) => {
              const spotsLeft = event.max_participants - event.participants;
              
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-primary border-primary/20">{event.category}</Badge>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">{event.difficulty}</Badge>
                        </div>
                        <CardTitle className="text-xl mb-2 leading-tight">{event.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {event.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{event.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{event.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{event.participants} / {event.max_participants} joined</span>
                        </div>
                        {spotsLeft > 0 && <Badge className="bg-yellow-500/10 text-yellow-600 font-semibold">{spotsLeft} spots left</Badge>}
                        {spotsLeft <= 0 && <Badge variant="destructive">Full</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="text-2xl font-bold text-primary">{event.price}</div>
                      <Button disabled={spotsLeft <= 0}>
                        {spotsLeft > 0 ? "Join Event" : "Sold Out"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Show a message if no events are found */}
          {eventsData.length === 0 && !isLoading && (
            <div className="text-center mt-10 p-10 text-muted-foreground border border-dashed rounded-xl">
              <Calendar className="h-6 w-6 mx-auto mb-3" />
              <p>No events currently scheduled. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
