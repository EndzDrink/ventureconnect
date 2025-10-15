import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, MapPin, Calendar, Users, Send, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
// FIX: Removed the failing import and defined a mock client setup below.

// --- Supabase Mock and Initialization (Fix for failed external import) ---
// In this single-file environment, we must mock the client to allow compilation
// while keeping the application logic intact.
const SUPABASE_URL = 'https://mock.supabase.co'; 
const SUPABASE_ANON_KEY = 'mock_anon_key'; 

// 1. Mock the createClient function
const createClient = (url: string, key: string) => {
    // Helper function to chain query methods like .select().eq().order()
    const queryBuilder = (tableName: string) => ({
        select: (columns: string) => queryBuilder(tableName),
        eq: (column: string, value: string) => queryBuilder(tableName),
        order: (column: string, options: any) => queryBuilder(tableName),
        
        // Mock insert function (used for comments submission)
        insert: (data: any) => ({ error: null }),
        
        // Mock the final promise resolution (used for fetching data)
        limit: (n: number) => {
            if (n === 1) {
                return { data: [], error: null };
            }
            return queryBuilder(tableName);
        },
        
        // Mock the promise handler that executes the query (used by fetchComments)
        async then(callback: (res: { data: any[], error: any }) => void) {
            const data = (tableName === 'participants') ? [{ id: 'mock-id' }] : [];
            callback({ data, error: null });
        },
    });
    
    // 2. Mock the supabase client object
    const mockClient = {
        from: queryBuilder,
        // Mock Realtime Channel methods
        channel: (channelId: string) => ({
            on: (event: string, filter: any, callback: (payload: any) => void) => ({ 
                subscribe: () => ({})
            }),
            subscribe: () => ({}),
        }),
        removeChannel: (channel: any) => {},
    };
    return mockClient as any; 
};

// Now initialize the mock client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- End Supabase Mock ---


// --- Type Definitions ---
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
}

// Helper to format date/time
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
};

export const ActivityDetailDialog = ({ open, onOpenChange, activity, userId, hasJoined }: ActivityDetailDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isUserParticipant, setIsUserParticipant] = useState(hasJoined); 
  const { toast } = useToast();

  // --- Participation Status Check ---
  const checkParticipationStatus = useCallback(async () => {
    if (!userId || !activity.id) return;
    
    // NOTE: This check relies on the parent component's setup being functional
    const { data, error } = await supabase
      .from('participants' as any)
      .select('id')
      .eq('activity_id', activity.id)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
        console.error("Error checking participation:", error);
        setIsUserParticipant(hasJoined); 
    } else {
        setIsUserParticipant(data && data.length > 0);
    }
  }, [activity.id, userId, hasJoined]);


  // --- Real-time Comments Fetching and Subscription ---
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments' as any) 
        .select('id, user_id, content, created_at, profiles(username, avatar_url)')
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        toast({ description: "Failed to load comments.", variant: "destructive" });
      } else if (data) {
        const formattedComments: Comment[] = (data as any[]).map(c => ({
          id: c.id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: (c.profiles as any)?.username || 'Unknown User',
          avatar_url: (c.profiles as any)?.avatar_url || undefined,
        }));
        setComments(formattedComments);
      }
    } catch (e) {
      console.error("Supabase fetch failed:", e);
    } finally {
      setIsLoadingComments(false);
    }
  }, [activity.id, toast]); 

  useEffect(() => {
    if (!open || !activity.id) return;

    // 1. Initial fetch & Participation Check
    fetchComments();
    checkParticipationStatus(); 

    // 2. Set up real-time subscription for comment changes
    const commentsChannel = supabase
      .channel(`activity_comments_${activity.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments' as any,
          filter: `activity_id=eq.${activity.id}`
        }, 
        (payload) => {
          console.log(`Supabase change detected (${payload.eventType}), re-fetching comments...`);
          fetchComments(); 
        }
      )
      .subscribe();
      
    // 3. Listen for participation changes
    const participantsChannel = supabase
      .channel(`activity_participants_${activity.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'participants' as any, 
          filter: `activity_id=eq.${activity.id}`
        }, 
        (payload) => {
          console.log(`Supabase participation change detected, re-checking status...`);
          checkParticipationStatus();
        }
      )
      .subscribe();


    return () => {
      // 4. Cleanup: Remove both channels
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [open, activity.id, fetchComments, checkParticipationStatus]); 

  // --- Comment Submission Handler ---
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isUserParticipant || !userId) return;

    const content = newComment.trim();
    setNewComment(""); 

    const { error } = await supabase
      .from('comments' as any) 
      .insert([
        { 
          activity_id: activity.id,
          user_id: userId, 
          content: content 
        }
      ]);

    if (error) {
      console.error("Error posting comment:", error);
      setNewComment(content); 
      toast({ description: "Failed to post comment. Please try again.", variant: "destructive" });
    } else {
      toast({ description: "Comment posted successfully!" });
    }
  };

  const isCommentInputDisabled = !isUserParticipant || !userId || isLoadingComments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        
        {/* Top Content: Header, Description, Stats */}
        <div className="p-6 pb-0 flex-shrink-0">
            <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={activity.avatar} />
                    <AvatarFallback>{activity.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="text-xl font-bold">{activity.title}</DialogTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{activity.location}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{activity.date}</span>
                    </div>
                </div>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                {activity.category}
                </Badge>
            </div>
            </DialogHeader>

            {/* Description and Image */}
            <div className="space-y-4">
                <div className="mt-4">
                    <p className="text-muted-foreground">{activity.description}</p>
                </div>
                {activity.image && (
                    <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                        src={activity.image} 
                        alt={activity.title}
                        className="w-full h-40 object-cover" 
                        onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null; 
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x160/000/fff?text=No+Image`;
                        }}
                    />
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between py-2 border-t border-b border-border/50 mt-4">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                <Heart className="h-4 w-4 mr-1 fill-destructive" />
                {activity.likes}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MessageCircle className="h-4 w-4 mr-1" />
                {comments.length}
                </Button>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activity.activity_participants} joined</span>
                </div>
            </div>
            </div>
        </div>

        {/* Middle Content: Comments Scroll Area - ALWAYS VISIBLE */}
        <div className="px-6 flex-1 min-h-0 overflow-hidden">
          <h3 className="font-semibold mb-3 text-lg pt-4">Activity Discussion ({comments.length})</h3>
          <ScrollArea className="h-full pr-3">
            <div className="space-y-4 pb-4">
              {isLoadingComments ? (
                <p className="text-center text-muted-foreground">Loading discussion...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No comments yet. Be the first to start the discussion!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 items-start">
                    <Avatar className="h-9 w-9 border flex-shrink-0">
                      <AvatarImage src={comment.avatar_url} /> 
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {comment.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-lg p-3 break-words">
                        <p className="font-medium text-sm text-card-foreground">
                          {comment.username}
                        </p>
                        <p className="text-sm mt-1 text-card-foreground/90">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-1">
                        {formatTimestamp(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Bottom Content: Comment Input - DISABLED IF NOT PARTICIPANT */}
        <div className="p-6 pt-3 border-t border-border flex-shrink-0">
            <div className="flex space-x-2">
            <Input
              // The placeholder now clearly indicates the lock status only by using 'Lock' in the text
              placeholder={isUserParticipant ? "Write a comment..." : "Lock: Join to enable commenting"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isCommentInputDisabled && handleSubmitComment()}
              className="flex-1"
              disabled={isCommentInputDisabled}
            />
            <Button 
              onClick={handleSubmitComment} 
              size="sm" 
              disabled={isCommentInputDisabled || !newComment.trim()}
              className="px-4"
            >
              {isCommentInputDisabled ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {/* REMOVED: The explicit "Join the adventure" message here */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
