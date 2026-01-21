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
      
      // Query the join table and 'inner join' the activity details
      const { data, error } = await supabase
        .from('activity_participants' as any)
        .select(`
          activity_id,
          activities (
            *,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id);

      if (data) {
        // Flatten the results so we get an array of activity objects
        const formatted = data
          .map((item: any) => item.activities)
          .filter(Boolean);
        setJoinedActivities(formatted);
      }
      setLoading(false);
    };

    fetchMyActivities();
  }, [user]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container py-8 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="text-primary h-8 w-8" /> My Adventures
        </h1>
        <p className="text-muted-foreground mt-2">Keep track of all the experiences you've joined.</p>
      </header>

      {joinedActivities.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl">
          <p className="text-muted-foreground">You haven't joined any adventures yet!</p>
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {joinedActivities.map((activity) => (
              <ActivityCard 
                key={activity.id} 
                userId={user?.id || ""} 
                {...activity} // This spreads id, title, image_url, etc. correctly
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}