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
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentParticipants, setCurrentParticipants] = useState(activity_participants);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAuthenticated = !!userId;

  const checkUserStatus = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    
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
  }, [id, userId, isAuthenticated]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({ description: "Please log in to like activities.", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (isLiked) {
      await supabase.from('activity_likes' as any).delete().eq('activity_id', id).eq('user_id', userId);
      setCurrentLikes(prev => prev - 1);
    } else {
      await supabase.from('activity_likes' as any).insert({ activity_id: id, user_id: userId });
      setCurrentLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleJoin = () => {
    setIsJoined(true);
    setCurrentParticipants(prev => prev + 1);
    toast({
      description: "Successfully joined! Discussion unlocked.",
    });
  };
  
  const handleUnauthenticatedJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ description: "Please log in or sign up to join activities." });
    navigate("/login");
  }

  const handleCardClick = () => {
    setShowDetail(true);
  };

  const activityData = {
    id, username, avatar, location, date, title, description, image, category,
    activity_participants: currentParticipants,
    likes: currentLikes,
    comments
  };

  return (
    <>
      <Card 
        className="overflow-hidden border-border bg-card shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground text-base">{username}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{location}</span>
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{date}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
              {category}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-6">
          <div className="space-y-3">
            <h3 className="font-bold text-xl text-card-foreground leading-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
          </div>
          
          {image && (
            <div className="rounded-xl overflow-hidden bg-muted/50 h-48 sm:h-64">
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'} p-1 h-auto`}
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium text-sm">{currentLikes}</span>
              </Button>
              
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground p-1 h-auto">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{comments}</span>
              </div>
            </div>

            {/* FIX: Wrapper div with e.stopPropagation() prevents the detail dialog from opening when joining */}
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {isJoined ? (
                <Button size="sm" variant="outline" disabled className="bg-green-50 text-green-600 border-green-200">
                  Joined ✓
                </Button>
              ) : (
                isAuthenticated ? (
                  <JoinActivityDialog activityTitle={title} category={category} onJoin={handleJoin}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 font-medium px-6">
                      Join
                    </Button>
                  </JoinActivityDialog>
                ) : (
                  <Button size="sm" className="bg-primary font-medium" onClick={handleUnauthenticatedJoinClick}>
                    Join
                  </Button>
                )
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