import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyAdventures() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<{ upcoming: any[], past: any[] }>({ upcoming: [], past: [] });
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
                profiles!activities_creator_id_fkey1 (
                  username,
                  avatar_url
                )
              )
            `)
            .eq('user_id', user.id); // 'user_id' is correct here as it refers to the participant
      
          if (error) throw error;
      
          if (data) {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
      
            const upcoming: any[] = [];
            const past: any[] = [];
      
            data.forEach((item: any) => {
              const act = item.activities;
              if (!act) return;
      
              const activityDate = new Date(act.date);
              
              // Handle joined profile data
              const profile = Array.isArray(act.profiles) ? act.profiles[0] : act.profiles;
      
              const formattedActivity = {
                ...act,
                username: profile?.username || 'User',
                avatar: profile?.avatar_url || '',
                date: act.date || 'Date TBD'
              };
      
              if (activityDate < startOfToday) {
                past.push(formattedActivity);
              } else {
                upcoming.push(formattedActivity);
              }
            });
            
            setActivities({ upcoming, past });
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
          Manage your upcoming trips and relive past memories.
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">History & Memories</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {activities.upcoming.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No upcoming adventures</h3>
              <p className="text-muted-foreground mt-2">Explore the feed to find your next experience!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {activities.upcoming.map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  userId={user?.id || ""} 
                  {...activity} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {activities.past.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No past adventures yet</h3>
              <p className="text-muted-foreground mt-2">Once you complete an adventure, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {activities.past.map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  userId={user?.id || ""} 
                  {...activity} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}