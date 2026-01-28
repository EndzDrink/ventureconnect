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
            <Card key={key} className="group relative overflow-hidden border-none shadow-xl bg-white rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop`} // Replace with event.image_url if added to DB
                  alt={title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Dark Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Category & Difficulty Badges */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <Badge className="bg-primary/90 hover:bg-primary border-none text-[10px] font-black uppercase tracking-tighter px-3">
                    {category}
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white text-[10px] font-bold uppercase px-3">
                    {difficulty}
                  </Badge>
                </div>

                {/* Spots Remaining Counter (Floating) */}
                {!isFull && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-pulse">
                      ONLY {spotsLeft} SPOTS LEFT
                    </div>
                  </div>
                )}

                {/* Bottom Image Overlay: Date & Location */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-white/90">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest">{date} • {time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold truncate max-w-[180px]">{location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- CONTENT BLOCK --- */}
              <CardHeader className="pt-6 pb-2">
                <CardTitle className="text-2xl font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2 italic text-slate-500 pt-1">
                  {description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-8">
                {/* Participant Progress Bar */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    <span>Tribe Growth</span>
                    <span className={isFull ? "text-red-500" : "text-primary"}>
                      {participants} / {maxParticipants} Joined
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 rounded-full ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${(participants / maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Footer / CTA Section */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all group-hover:bg-slate-100/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Entry Fee</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">
                      {price === "0" || price?.toLowerCase() === "free" ? "FREE" : price}
                    </span>
                  </div>
                  
                  <Button 
                    disabled={isFull}
                    className={`h-12 px-6 rounded-xl font-black uppercase text-xs transition-all shadow-lg 
                      ${isFull 
                        ? 'bg-slate-300' 
                        : 'bg-primary hover:bg-primary/90 text-white shadow-[0_10px_20px_-10px_rgba(234,88,12,0.5)] group-hover:px-8'
                      }`}
                  >
                    {isFull ? "Sold Out" : "Join Tribe"}
                  </Button>
                </div>
              </CardContent>

              {/* Decorative Elements */}
              <div className="absolute top-1/2 right-[-5px] w-3 h-6 bg-background rounded-l-full border-y border-l border-slate-100" />
              <div className="absolute top-1/2 left-[-5px] w-3 h-6 bg-background rounded-r-full border-y border-r border-slate-100" />
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
