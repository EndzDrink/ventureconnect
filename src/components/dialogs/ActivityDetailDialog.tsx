import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, MapPin, Calendar, Users, Send, Lock } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  const fetchComments = useCallback(async () => {
    if (!activity.id || !open) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments' as any)
        .select(`
          id, 
          user_id, 
          content, 
          created_at, 
          profiles(username, avatar_url)
        `)
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: true });

      if (data) {
        const formatted: Comment[] = data.map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: c.profiles?.username || 'User',
          avatar_url: c.profiles?.avatar_url
        }));
        setComments(formatted);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activity.id, open]);

  useEffect(() => {
    fetchComments();

    // REALTIME SUBSCRIPTION
    if (open && activity.id) {
      const channel = supabase
        .channel(`activity_comments_${activity.id}`)
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments', 
            filter: `activity_id=eq.${activity.id}` 
          }, 
          async (payload) => {
            // When a new comment is inserted, we fetch its profile data and add it to state
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newIncomingComment: Comment = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              username: profileData?.username || 'User',
              avatar_url: profileData?.avatar_url
            };

            setComments((prev) => [...prev, newIncomingComment]);
            setTimeout(scrollToBottom, 50);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activity.id, open, fetchComments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !userId) return;

    const { error } = await supabase
      .from('comments' as any)
      .insert([{ 
        activity_id: activity.id, 
        user_id: userId, 
        content: newComment.trim() 
      }]);
    
    if (!error) {
      setNewComment("");
      // No need to manually fetch here anymore, the Realtime listener will catch it!
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.avatar} />
                <AvatarFallback>{activity.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-bold">{activity.title}</DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {activity.location} 
                  <span>•</span>
                  <Calendar className="h-3 w-3" /> {activity.date}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activity.category}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 w-full bg-white">
          <div className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activity.description}
            </p>
            
            {activity.image && (
              <div className="rounded-xl overflow-hidden border bg-muted">
                <img src={activity.image} className="w-full h-auto object-cover max-h-[300px]" alt="Activity" />
              </div>
            )}
            
            <div className="flex items-center gap-6 py-4 border-y border-border/50 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} /> 
                {activity.likes} Likes
              </span>
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Users className="h-4 w-4" /> 
                {activity.activity_participants} Participants
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Discussion
              </h4>
              
              {isLoading && comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-xs text-muted-foreground animate-pulse">Loading discussion...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl flex flex-col items-center gap-2">
                   <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
                   <p className="text-sm text-muted-foreground">No messages yet. Be the first to say hi!</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {comments.map((c) => (
                    <div key={c.id} className={`flex gap-3 items-start ${c.user_id === userId ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 border shrink-0">
                        <AvatarImage src={c.avatar_url} />
                        <AvatarFallback>{c.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[80%] ${c.user_id === userId ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl text-sm ${
                          c.user_id === userId 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-muted/50 rounded-tl-none'
                        }`}>
                          {c.user_id !== userId && <p className="font-bold text-[10px] uppercase mb-1 opacity-70">{c.username}</p>}
                          <p>{c.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          {!hasJoined ? (
            <div className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-xl bg-white text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              <span>Join this activity to participate in the discussion</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder="Write a message..." 
                className="bg-white"
              />
              <Button onClick={handlePostComment} disabled={!newComment.trim()} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};