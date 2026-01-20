import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, MapPin, Calendar, Users, Send, Lock } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface ActivityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: {
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
  };
  userId: string; 
  hasJoined: boolean; 
  isLiked: boolean; 
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Just now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
};

export const ActivityDetailDialog = ({ 
  open, 
  onOpenChange, 
  activity, 
  userId, 
  hasJoined,
  isLiked 
}: ActivityDetailDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const { toast } = useToast();
  
  // Create a ref for the end of the comments list
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isUserParticipant, setIsUserParticipant] = useState(hasJoined); 

  useEffect(() => {
    setIsUserParticipant(hasJoined);
  }, [hasJoined, open]);

  // FIX: Scroll to bottom using a dummy div at the end of the list
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom();
    }
  }, [comments]);

  const fetchComments = useCallback(async () => {
    if (!activity.id) return;
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments') 
        .select(`id, user_id, content, created_at, profiles (username, avatar_url)`)
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: true });

      if (data) {
        const formattedComments: Comment[] = (data as any[]).map(c => ({
          id: c.id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: c.profiles?.username || 'User',
          avatar_url: c.profiles?.avatar_url,
        }));
        setComments(formattedComments);
      }
    } finally {
      setIsLoadingComments(false);
    }
  }, [activity.id]); 

  useEffect(() => {
    if (!open || !activity.id) return;
    fetchComments();

    const channel = supabase
      .channel(`activity_updates_${activity.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `activity_id=eq.${activity.id}` }, () => fetchComments())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, activity.id, fetchComments]); 

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isUserParticipant || !userId) return;
    const currentComment = newComment.trim();
    setNewComment(""); 

    const { error } = await supabase
      .from('comments') 
      .insert([{ activity_id: activity.id, user_id: userId, content: currentComment }]);

    if (error) {
      setNewComment(currentComment); 
      toast({ description: "Failed to send comment.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="p-6 pb-4 border-b border-border bg-card shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-left">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback>{activity.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-lg font-bold">{activity.title}</DialogTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {activity.location} • <Calendar className="h-3 w-3" /> {activity.date}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{activity.category}</Badge>
            </div>
          </DialogHeader>
        </div>

        {/* ScrollArea - Corrected by removing invalid viewportRef prop */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">{activity.description}</p>
              {activity.image && (
                <div className="rounded-xl overflow-hidden border bg-muted">
                  <img src={activity.image} className="w-full h-auto max-h-64 object-cover" alt="Activity" />
                </div>
              )}
              <div className="flex items-center gap-6 py-3 border-y border-border/50">
                <div className={`flex items-center gap-1.5 text-sm ${isLiked ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} /> {activity.likes} Likes
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {activity.activity_participants} Participants
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold sticky top-0 bg-background py-2 z-10">
                <MessageCircle className="h-4 w-4" />
                <span>Discussion ({comments.length})</span>
              </div>
              
              {isLoadingComments ? (
                <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 border shrink-0">
                        <AvatarImage src={comment.avatar_url} />
                        <AvatarFallback className="text-[10px]">{comment.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/40 rounded-2xl rounded-tl-none p-3 text-sm">
                          <p className="font-bold text-xs text-primary mb-1">{comment.username}</p>
                          <p className="text-foreground">{comment.content}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1">{formatTimestamp(comment.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {/* FIX: Anchor div for scrolling to bottom */}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Input */}
        <div className="p-4 bg-card border-t border-border shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isUserParticipant ? (
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 border border-dashed border-border rounded-xl text-muted-foreground">
              <Lock className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Join this activity to participate in the discussion</p>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <Input
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSubmitComment();
                }}
                className="bg-background rounded-xl h-11"
              />
              <Button onClick={(e) => { e.stopPropagation(); handleSubmitComment(); }} disabled={!newComment.trim()} size="icon" className="h-11 w-11 rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};