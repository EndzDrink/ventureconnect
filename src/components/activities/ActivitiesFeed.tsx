import { ActivityCard } from "./ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, SlidersHorizontal, LayoutGrid, Map as MapIcon } from "lucide-react";
import { CreateActivityDialog } from "@/components/dialogs/CreateActivityDialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MapView } from "./MapView"; // Ensure you created this file
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["All", "hiking", "water-sports", "Arts & Culture", "Cycling", "Sightseeing", "Social", "Food & Beverages"];

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
    `); 

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

export const ActivitiesFeed = ({ userId }: { userId: string }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("soonest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  const { data: activities, isLoading, isError, error } = useQuery({
    queryKey: ['activitiesFeed'],
    queryFn: fetchActivities,
  });

  const processedActivities = useMemo(() => {
    if (!activities) return [];
    
    let result = activities.filter((activity) => {
      const matchesCategory = selectedCategory === "All" || activity.category === selectedCategory;
      const matchesSearch = 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === "soonest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "most-liked") {
        return b.likes - a.likes;
      }
      if (sortBy === "popular") {
        return b.participants - a.participants;
      }
      return 0;
    });
  }, [activities, selectedCategory, searchQuery, sortBy]);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading adventures...</div>;
  if (isError) return <div className="text-center py-12 text-red-500">Error: {error?.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Discover Adventures</h2>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="sm" 
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => setViewMode("list")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button 
              variant={viewMode === "map" ? "default" : "ghost"} 
              size="sm"
              className="h-8 px-3 text-xs md:text-sm"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>

          <CreateActivityDialog>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Activity</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </CreateActivityDialog>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by title or location..." 
              className="pl-10 bg-white/50 border-muted-foreground/20 focus-visible:ring-accent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/50 border-muted-foreground/20">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Soonest Date</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>

      <div className="min-h-[400px]">
        {viewMode === "map" ? (
          <MapView activities={processedActivities} />
        ) : (
          <div className="space-y-6">
            {processedActivities.length === 0 ? (
               <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
                 <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                 </div>
                 <p className="font-medium">No results found</p>
                 <Button 
                    variant="link" 
                    className="mt-4 text-accent"
                    onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSortBy("soonest"); }}
                  >
                    Reset all filters
                  </Button>
               </div>
            ) : (
              processedActivities.map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  userId={userId} 
                  {...activity} 
                  activity_participants={activity.participants}
                /> 
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};