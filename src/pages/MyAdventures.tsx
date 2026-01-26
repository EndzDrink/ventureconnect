import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar } from "lucide-react";

export default function MyAdventures() {
  const { user } = useAuth();
  const [joinedActivities, setJoinedActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyActivities = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('activity_participants' as any)
          .select(`
            activity_id,
            activities (
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          // Get the start of today to ensure we include events happening later today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          const formatted = data
            .map((item: any) => {
              const act = item.activities;
              if (!act) return null;
              
              // 1. Convert the activity date string to a Date object
              const activityDate = new Date(act.date);
              
              // 2. Filter out past events: If activity date is before today, hide it
              if (activityDate < startOfToday) return null;

              return {
                ...act,
                username: act.profiles?.username || 'User',
                avatar: act.profiles?.avatar_url || '',
                date: act.date || 'Date TBD'
              };
            })
            .filter(Boolean); 
          
          setJoinedActivities(formatted);
        }
      } catch (err) {
        console.error("Error fetching joined adventures:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyActivities();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your adventures...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="text-primary h-8 w-8" /> 
          My Adventures
        </h1>
        <p className="text-muted-foreground mt-2">
          Keep track of your upcoming experiences.
        </p>
      </header>

      {joinedActivities.length === 0 ? (
        <div className="text-center py-32 border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No upcoming adventures</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">
            Past events are hidden. Explore the feed to join new activities!
          </p>
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {joinedActivities.map((activity) => (
              <ActivityCard 
                key={activity.id} 
                userId={user?.id || ""} 
                {...activity} 
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}