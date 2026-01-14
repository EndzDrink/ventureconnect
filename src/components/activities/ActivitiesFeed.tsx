import { useEffect } from "react"; // Added useEffect
import { ActivityCard } from "./ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/CreateActivityDialog";
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  creator_id: string; 
  username: string;
  avatar: string | null;
  participants: number; 
  likes: number;        
  comments: number;     
  image: string | null;
}

const fetchActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities' as any)
    .select(`
      id, 
      title, 
      description, 
      location, 
      date, 
      category, 
      participants, 
      likes, 
      comments, 
      image_url, 
      creator_id,
      profiles(username, avatar_url)
    `) 
    .order('date', { ascending: false }); 

  if (error) {
    console.error("Supabase Activity Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  const activitiesData = (data || []).map((item: any) => {
    const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      location: item.location,
      date: item.date,
      category: item.category,
      participants: item.participants || 0,
      likes: item.likes || 0,
      comments: item.comments || 0,
      image: item.image_url, 
      creator_id: item.creator_id,
      username: profileData?.username || 'Unknown User',
      avatar: profileData?.avatar_url || null,
    };
  });

  return activitiesData as unknown as Activity[];
};

interface ActivitiesFeedProps {
    userId: string;
}

export const ActivitiesFeed = ({ userId }: ActivitiesFeedProps) => {
  const queryClient = useQueryClient(); // Access the query client to manually invalidate cache

  const { data: activities, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activitiesFeed'],
    queryFn: fetchActivities,
  });

  // --- REAL-TIME CONNECTION ---
  useEffect(() => {
    // 1. Create a channel to listen for changes on the 'activities' table
    const channel = supabase
      .channel('activities_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL events (Insert, Update, Delete)
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          console.log('Real-time change detected!', payload);
          // 2. Trigger a refetch of the data
          refetch();
          // Alternatively, invalidate the query to force a clean background refresh:
          // queryClient.invalidateQueries({ queryKey: ['activitiesFeed'] });
        }
      )
      .subscribe();

    // 3. Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading exciting adventures...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load activities: {error?.message}. 
      </div>
    );
  }

  const activitiesData = activities || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Discover Adventures</h2>
        <CreateActivityDialog>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </CreateActivityDialog>
      </div>

      <div className="space-y-6">
        {activitiesData.length === 0 ? (
           <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
             No activities posted yet. Be the first to start an adventure!
           </div>
        ) : (
          activitiesData.map((activity) => (
            <ActivityCard activity_participants={0} key={activity.id} userId={userId} {...activity} /> 
          ))
        )}
      </div>
    </div>
  );
};