import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, Calendar } from "lucide-react";
import { JoinActivityDialog } from "../dialogs/JoinActivityDialog"; 
import { ActivityDetailDialog } from "../dialogs/ActivityDetailDialog";
import { useState, useEffect, useCallback } from "react"; 
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client"; 

interface ActivityCardProps {
  id: string;
  username: string;
  avatar?: string;
  location: string;
  date: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  activity_participants: number;
  likes: number;
  comments: number;
  userId: string;
}

export const ActivityCard = ({
  id,
  username,
  avatar,
  location,
  date,
  title,
  description,
  image,
  category,
  activity_participants,
  likes,
  comments,
  userId,
}: ActivityCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isJoined, setIsJoined] = useState(false); 
  const [showDetail, setShowDetail] = useState(false);
  
  // Local states to keep UI in sync with live database counts
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentParticipants, setCurrentParticipants] = useState(activity_participants);
  const [currentComments, setCurrentComments] = useState(comments);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAuthenticated = !!userId;

  // Function to fetch the absolute latest counts from DB for this specific card
  const refreshCounts = useCallback(async () => {
    if (!id) return;

    // Fetch Likes Count
    const { count: likesCount } = await supabase
      .from('activity_likes' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    // Fetch Participants Count
    const { count: partsCount } = await supabase
      .from('activity_participants' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    // Fetch actual Comment Count (Fixes the mismatch you noticed)
    const { count: commsCount } = await supabase
      .from('comments' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    if (likesCount !== null) setCurrentLikes(likesCount);
    if (partsCount !== null) setCurrentParticipants(partsCount);
    if (commsCount !== null) setCurrentComments(commsCount);
  }, [id]);

  // Check if the current user has already liked or joined
  const checkUserStatus = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    
    try {
      const { data: participation } = await supabase
        .from('activity_participants' as any)
        .select('id')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (participation) setIsJoined(true);

      const { data: likeData } = await supabase
        .from('activity_likes' as any) 
        .select('id')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (likeData) setIsLiked(true);
    } catch (error) {
      console.error("Error checking status:", error);
    }
  }, [id, userId, isAuthenticated]);

  useEffect(() => {
    checkUserStatus();
    refreshCounts();

    // Listen for real-time changes so the card updates instantly if someone else comments/joins
    const channel = supabase
      .channel(`card_stats_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_likes', filter: `activity_id=eq.${id}` }, () => refreshCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_participants', filter: `activity_id=eq.${id}` }, () => refreshCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `activity_id=eq.${id}` }, () => refreshCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, checkUserStatus, refreshCounts]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ description: "Please log in to like activities.", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (isLiked) {
      await supabase.from('activity_likes' as any).delete().eq('activity_id', id).eq('user_id', userId);
      setIsLiked(false);
    } else {
      await supabase.from('activity_likes' as any).insert({ activity_id: id, user_id: userId });
      setIsLiked(true);
    }
    refreshCounts(); 
  };

  const handleJoin = () => {
    setIsJoined(true);
    refreshCounts();
  };
  
  const handleCardClick = () => {
    setShowDetail(true);
  };

  // Data object passed to the Detail Dialog
  const activityData = {
    id, username, avatar, location, date, title, description, image, category,
    activity_participants: currentParticipants,
    likes: currentLikes,
    comments: currentComments // Pass the live synced count
  };

  return (
    <>
      <Card 
        className="overflow-hidden border-border bg-card shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-background">
                <AvatarImage src={avatar} />
                <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-card-foreground">{username}</p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                  <span>•</span>
                  <Calendar className="h-3 w-3" />
                  <span>{date}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {category}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-6">
          <div className="space-y-2">
            <h3 className="font-bold text-lg leading-tight">{title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-3">{description}</p>
          </div>
          
          {image && (
            <div className="rounded-xl overflow-hidden bg-muted/50 h-48">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${isLiked ? 'text-destructive' : 'text-muted-foreground'} p-1 h-auto`}
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{currentLikes}</span>
              </Button>
              
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground p-1 h-auto">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{currentComments}</span>
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              {isJoined ? (
                <Button size="sm" variant="outline" disabled className="bg-green-50 text-green-600 border-green-200">
                  Joined ✓
                </Button>
              ) : (
                <JoinActivityDialog 
                  activityTitle={title} 
                  activityId={id}  
                  userId={userId}    
                  category={category} 
                  onJoin={handleJoin}
                >
                  <Button size="sm">Join</Button>
                </JoinActivityDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ActivityDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        activity={activityData}
        userId={userId} 
        hasJoined={isJoined}
        isLiked={isLiked}
      />
    </>
  );
};