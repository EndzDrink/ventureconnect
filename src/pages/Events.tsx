import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartyPopper, MapPin, Users, Clock } from "lucide-react";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client'; 
// We are intentionally avoiding importing from database.types for the 'Event' type 
// because 'events' is missing from that file, causing the error.

// --- Types ---

// Manual Type Definition: We are forced to define this manually because the 
// 'events' table is missing from the auto-generated database.types.ts file.
interface Event {
  id: string | number | null; 
  title: string | null;
  description: string | null;
  date: string | null;          
  time: string | null;          
  location: string | null;
  participants: number | null;  
  max_participants: number | null; 
  category: string | null;
  difficulty: string | null;
  price: string | null;         
}

// Interface for the component props (to satisfy ProtectedRoute)
interface EventsPageProps {
  userId: string; // Required by ProtectedRoute, even if not used here
}


// --- Data Fetching ---

// Define the data fetching function
const fetchEvents = async (): Promise<Event[]> => {
  // Use 'as any' ONLY on the table name to bypass the TypeScript error that 
  // the table name 'events' is not recognized by the auto-generated types.
  
  // FIX: Explicitly cast the query result structure to inform TypeScript
  const { data, error } = (await supabase
    .from('events' as any) 
    .select(`*`) // Select all columns
    .order('date', { ascending: true })) as { data: Event[] | null, error: any }; // <--- FIX APPLIED HERE

  if (error) {
    console.error("Supabase Event Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // Now, TypeScript knows 'data' is Event[] | null, and since we check for error, 
  // we can safely return it (coalescing to an empty array).
  return data ?? [];
};

// --- Component ---

const Events: React.FC<EventsPageProps> = ({ userId }) => { 
  const { data: events, isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8 text-center">Loading events...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <PartyPopper className="h-8 w-8 text-primary" />
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Travel Events</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Join exciting travel events and meet like-minded adventurers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsData.map((event) => {
              // --- Data Safety and Coalescing ---
              // Ensure all fields are safely accessed using nullish coalescing (??)
              const title = event.title ?? 'No Title';
              const description = event.description ?? 'No description available.';
              const location = event.location ?? 'TBD';
              const date = event.date ?? 'Date TBD';
              const time = event.time ?? 'Time TBD';
              const category = event.category ?? 'General';
              const difficulty = event.difficulty ?? 'Easy';
              const price = event.price ?? 'Free';
              // Ensure numbers are handled safely, defaulting to 0
              const participants = event.participants ?? 0;
              const maxParticipants = event.max_participants ?? 0;
              
              const spotsLeft = maxParticipants - participants;
              const isFull = spotsLeft <= 0;
              
              // Key needs to be a stable string/number. Use id but safely handle null/undefined.
              const key = event.id ? String(event.id) : title; 
              
              return (
                <Card key={key} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-primary border-primary/20">{category}</Badge>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">{difficulty}</Badge>
                        </div>
                        <CardTitle className="text-xl mb-2 leading-tight">{title}</CardTitle>
                        <CardDescription className="text-sm">
                          {description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{participants} / {maxParticipants} joined</span>
                        </div>
                        {spotsLeft > 0 && <Badge className="bg-yellow-500/10 text-yellow-600 font-semibold">{spotsLeft} spots left</Badge>}
                        {isFull && <Badge variant="destructive">Full</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="text-2xl font-bold text-primary">{price}</div>
                      <Button disabled={isFull}>
                        {isFull ? "Sold Out" : "Join Event"}
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
              <PartyPopper className="h-6 w-6 mx-auto mb-3" />
              <p>No events currently scheduled. Check back soon!</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default Events;
