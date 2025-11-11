import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, Calendar, Users } from "lucide-react";
// FIX: Changing relative path depth to ensure successful compilation
import { JoinActivityDialog } from "../dialogs/JoinActivityDialog"; 
import { ActivityDetailDialog } from "../dialogs/ActivityDetailDialog";
import { useState, useEffect, useCallback } from "react"; // Added useCallback/useEffect
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client"; // Reverting to original path

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
  // Initialize isJoined to false, then check database status on load
  const [isJoined, setIsJoined] = useState(false); 
  const [showDetail, setShowDetail] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentParticipants, setCurrentParticipants] = useState(activity_participants);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAuthenticated = !!userId;

  // --- Participation Status Check for Card ---
  const checkParticipationStatus = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    
    // Assumes a 'participants' table with 'user_id' and 'activity_id' columns
    const { data, error } = await supabase
      .from('activity_participants' as any)
      .select('id')
      .eq('activity_id', id)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
        console.error("Error checking card participation:", error);
    } else {
        // If data is returned, the user is a participant (data.length > 0)
        setIsJoined(data && data.length > 0);
    }
  }, [id, userId, isAuthenticated]);

  useEffect(() => {
    checkParticipationStatus();
  }, [checkParticipationStatus]);


  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        description: "Please log in to like activities.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Placeholder logic for liking. Actual DB update would go here.
    setIsLiked(!isLiked);
    setCurrentLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleJoin = () => {
    // This function is called after successful join/registration in the dialog
    // We set the state and then the DB check on next load/detail open will confirm
    setIsJoined(true);
    setCurrentParticipants(prev => prev + 1);
    toast({
      description: "Successfully joined the activity! You can now participate in comments.",
    });
  };
  
  // Handles the click for unauthenticated users on the Join button (redirects to login)
  const handleUnauthenticatedJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      description: "Please log in or sign up to join activities.",
      variant: "default",
    });
    navigate("/login");
  }

  const handleCardClick = () => {
    setShowDetail(true);
  };

  const activityData = {
    id,
    username,
    avatar,
    location,
    date,
    title,
    description,
    image,
    category,
    activity_participants: currentParticipants,
    likes: currentLikes,
    comments // Pass the original comments count for the card stats
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
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
          
          {image && (
            <div className="rounded-xl overflow-hidden bg-muted/50">
              <img 
                src={image} 
                alt={title}
                className="w-full h-64 object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'} transition-colors p-2 h-auto`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{currentLikes}</span>
              </Button>
              
              {/* REQUIREMENT: Re-added the Comments button/counter for the summary view */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground p-2 h-auto">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{comments}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">{currentParticipants} joined</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isJoined ? (
                <Button size="sm" variant="outline" disabled className="bg-primary/10 text-primary border-primary/20">
                  Joined ✓
                </Button>
              ) : (
                // AUTH FLOW: If authenticated, open dialog. If not, redirect to login.
                isAuthenticated ? (
                  <JoinActivityDialog activityTitle={title} category={category} onJoin={handleJoin}>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm px-2 sm:px-4">
                      <span className="hidden sm:inline">Join</span>
                      <span className="sm:hidden">Join</span>
                    </Button>
                  </JoinActivityDialog>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm px-2 sm:px-4"
                    onClick={handleUnauthenticatedJoinClick} // Redirect to login
                  >
                    <span className="hidden sm:inline">Join Adventure</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note: hasJoined prop still passes the local state, but the Dialog now checks the DB */}
      <ActivityDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        activity={activityData}
        userId={userId} 
        hasJoined={isJoined}
      />
    </>
  );
};
