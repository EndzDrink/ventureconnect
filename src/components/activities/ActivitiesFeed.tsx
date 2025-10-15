import { ActivityCard } from "./ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/CreateActivityDialog";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// --- 1. Define the Activity Interface ---
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

// --- 2. Define the Data Fetching Function (FIXED ORDERING) ---
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
    // CRITICAL CHANGE: Order by date in descending order (false)
    .order('date', { ascending: false }); 

  if (error) {
    console.error("Supabase Activity Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // Mapping logic to safely handle array/object response from Supabase join
  const activitiesData = (data || []).map((item: any) => {
    // Safely check if profiles is an array (and get the first item) or a single object
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
      
      // Safely extract username and avatar
      username: profileData?.username || 'Unknown User',
      avatar: profileData?.avatar_url || null,
    };
  });

  return activitiesData as unknown as Activity[];
};

// --- ActivitiesFeed Props Definition ---
// NEW: Define the props interface to receive userId
interface ActivitiesFeedProps {
    userId: string;
}

// --- ActivitiesFeed Component (with Prop Update) ---
export const ActivitiesFeed = ({ userId }: ActivitiesFeedProps) => { // NEW: Accept userId
  // 3. Use React Query to fetch the data
  const { data: activities, isLoading, isError, error } = useQuery({
    queryKey: ['activitiesFeed'],
    queryFn: fetchActivities,
  });

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
            // NEW: Pass the received userId down to ActivityCard
            <ActivityCard key={activity.id} userId={userId} {...activity} /> 
          ))
        )}
      </div>
    </div>
  );
};
