import { ActivityCard } from "./ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/CreateActivityDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Defined categories to match your CreateActivityDialog options
const CATEGORIES = ["All", "Hiking", "water-sports", "Arts & Culture", "Cycling", "Sightseeing", "Social", "Food & Beverages"];

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
      id, title, description, location, date, category, 
      participants, likes, comments, image_url, creator_id,
      profiles(username, avatar_url)
    `) 
    .order('date', { ascending: true }); 

  if (error) throw new Error(error.message);
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (data || [])
    .map((item: any) => {
      const activityDate = new Date(item.date);
      if (activityDate < startOfToday) return null;

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
    })
    .filter(Boolean) as Activity[];
};

interface ActivitiesFeedProps {
    userId: string;
}

export const ActivitiesFeed = ({ userId }: ActivitiesFeedProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const { data: activities, isLoading, isError, error } = useQuery({
    queryKey: ['activitiesFeed'],
    queryFn: fetchActivities,
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading adventures...</div>;
  if (isError) return <div className="text-center py-12 text-red-500">Error: {error?.message}</div>;

  // Filter the data based on the selected category pill
  const filteredActivities = (activities || []).filter(activity => 
    selectedCategory === "All" || activity.category === selectedCategory
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Discover Adventures</h2>
        <CreateActivityDialog>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </CreateActivityDialog>
      </div>

      {/* Category Filter Toggle */}
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex w-max space-x-2">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className={`px-4 py-1.5 cursor-pointer transition-all ${
                selectedCategory === category 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-muted-foreground/10 text-muted-foreground"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      <div className="space-y-6">
        {filteredActivities.length === 0 ? (
           <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
             <p>No upcoming {selectedCategory !== "All" ? selectedCategory.toLowerCase() : ""} adventures found.</p>
             <p className="text-xs mt-1 text-muted-foreground/60">Try choosing a different category or start one yourself!</p>
           </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              userId={userId} 
              {...activity} 
              activity_participants={activity.participants}
            /> 
          ))
        )}
      </div>
    </div>
  );
};