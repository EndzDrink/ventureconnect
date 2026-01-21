import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { JoinActivityDialog } from "../dialogs/JoinActivityDialog"; 
import { ActivityDetailDialog } from "../dialogs/ActivityDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentParticipants, setCurrentParticipants] = useState(activity_participants);
  const [currentComments, setCurrentComments] = useState(comments);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAuthenticated = !!userId;

  const refreshCounts = useCallback(async () => {
    if (!id) return;

    const { count: likesCount } = await supabase
      .from('activity_likes' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    const { count: partsCount } = await supabase
      .from('activity_participants' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    const { count: commsCount } = await supabase
      .from('comments' as any)
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);

    if (likesCount !== null) setCurrentLikes(likesCount);
    if (partsCount !== null) setCurrentParticipants(partsCount);
    if (commsCount !== null) setCurrentComments(commsCount);
  }, [id]);

  const checkUserStatus = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    
    try {
      const { data: participation } = await supabase
        .from('activity_participants' as any)
        .select('id')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      setIsJoined(!!participation);

      const { data: likeData } = await supabase
        .from('activity_likes' as any) 
        .select('id')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      setIsLiked(!!likeData);
    } catch (error) {
      console.error("Error checking status:", error);
    }
  }, [id, userId, isAuthenticated]);

  useEffect(() => {
    checkUserStatus();
    refreshCounts();

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

  const handleLeaveConfirm = async () => {
    try {
      const { error } = await supabase
        .from('activity_participants' as any)
        .delete()
        .eq('activity_id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setIsJoined(false);
      refreshCounts();
      toast({ description: "You have left the activity." });
    } catch (error) {
      toast({ description: "Error leaving activity.", variant: "destructive" });
    } finally {
      setShowLeaveAlert(false);
    }
  };
  
  const handleCardClick = () => {
    setShowDetail(true);
  };

  const activityData = {
    id, username, avatar, location, date, title, description, image, category,
    activity_participants: currentParticipants,
    likes: currentLikes,
    comments: currentComments
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

            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {isJoined ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowLeaveAlert(true)}
                  className="bg-green-50 text-green-600 border-green-200 opacity-100 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200 group min-w-[100px]"
                >
                  <span className="group-hover:hidden">Joined ✓</span>
                  <span className="hidden group-hover:inline">Leave?</span>
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

      {/* Confirmation Alert for Leaving */}
      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Leave Activity?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{title}</strong>? 
              You will no longer be able to participate in the discussion thread.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Adventure</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};