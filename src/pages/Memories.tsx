import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Heart, MapPin, Send, Disc, Music, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Memories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['communityMemories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_memories' as any)
        .select(`
          *,
          activities (title, location),
          profiles (username, avatar_url),
          memory_likes (user_id),
          memory_comments (id, content, created_at, profiles (username))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        activity_title: item.activities?.title || "Adventure",
        location_name: item.activities?.location || "South Africa",
        username: item.profiles?.username || "Explorer",
        avatar_url: item.profiles?.avatar_url,
        likes_count: item.memory_likes?.length || 0,
        comments_count: item.memory_comments?.length || 0,
        is_liked: item.memory_likes?.some((l: any) => l.user_id === user?.id)
      }));
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ memoryId, isLiked }: { memoryId: string, isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from('memory_likes' as any).delete().eq('memory_id', memoryId).eq('user_id', user?.id);
      } else {
        await supabase.from('memory_likes' as any).insert({ memory_id: memoryId, user_id: user?.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityMemories'] }),
  });

  const postComment = useMutation({
    mutationFn: async (memoryId: string) => {
      if (!newComment.trim()) return;
      await supabase.from('memory_comments' as any).insert({
        memory_id: memoryId,
        user_id: user?.id,
        content: newComment
      });
    },
    onSuccess: () => {
      setNewComment("");
      setCommentingId(null);
      queryClient.invalidateQueries({ queryKey: ['communityMemories'] });
      toast({ title: "Comment shared!" });
    }
  });

  const handlePlayPreview = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingUrl(url);
      }
    }
  };

  if (isLoading) return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] w-full rounded-[2.5rem]" />)}
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      <header className="mb-12">
      <h1 className="text-4xl font-black tracking-tight mb-2">COMMUNITY MEMORIES</h1>
          <p className="text-muted-foreground">See what the WonderConnect tribe has been up to.</p>
      </header>

      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {memories?.map((memory) => (
          <Card key={memory.id} className="break-inside-avoid overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card hover:shadow-primary/10 transition-all duration-500">
            {/* Media & Song Overlay */}
            <div className="relative group overflow-hidden">
              {memory.media_type === 'video' ? (
                <video src={memory.media_url} className="w-full object-cover" controls muted />
              ) : (
                <img src={memory.media_url} className="w-full hover:scale-110 transition-transform duration-700" alt="Memory" />
              )}
              
              <Badge className="absolute top-6 left-6 bg-black/50 backdrop-blur-xl border-none text-[10px] font-black tracking-widest uppercase">
                <MapPin className="h-3 w-3 mr-1 text-primary" /> {memory.location_name}
              </Badge>

              {memory.song_data && (
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-2xl border border-white/20 p-3 rounded-[2rem] flex items-center gap-3 shadow-2xl">
                  <div className="relative h-12 w-12 shrink-0 group/music">
                    <img 
                      src={memory.song_data.cover} 
                      className={`h-full w-full rounded-2xl object-cover shadow-lg ${playingUrl === memory.song_data.preview_url ? 'animate-spin-slow' : ''}`} 
                    />
                    {memory.song_data.preview_url && (
                      <button 
                        onClick={() => handlePlayPreview(memory.song_data.preview_url)}
                        className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover/music:opacity-100 transition-opacity"
                      >
                        {playingUrl === memory.song_data.preview_url ? <Pause className="text-white h-6 w-6" /> : <Play className="text-white h-6 w-6" />}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white uppercase truncate tracking-tight">{memory.song_data.title}</p>
                    <p className="text-[10px] font-bold text-white/70 truncate">{memory.song_data.artist}</p>
                  </div>
                  <Music className={`h-4 w-4 text-primary ${playingUrl === memory.song_data.preview_url ? 'animate-bounce' : ''}`} />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-10 w-10 ring-4 ring-primary/5">
                  <AvatarImage src={memory.avatar_url} />
                  <AvatarFallback className="font-black bg-primary/10 text-primary">{memory.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tighter leading-none">{memory.username}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{format(new Date(memory.created_at), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              <h3 className="text-primary font-black uppercase tracking-widest text-[10px] mb-2">{memory.activity_title}</h3>
              <p className="text-lg font-bold leading-snug mb-6 italic">"{memory.caption}"</p>

              <div className="flex items-center justify-between pt-6 border-t border-muted/50">
                <div className="flex gap-6">
                  <button 
                    onClick={() => toggleLike.mutate({ memoryId: memory.id, isLiked: memory.is_liked })}
                    className={`flex items-center gap-2 text-xs font-black transition-all ${memory.is_liked ? 'text-red-500 scale-110' : 'text-muted-foreground hover:text-red-500'}`}
                  >
                    <Heart className={`h-5 w-5 ${memory.is_liked ? 'fill-current' : ''}`} />
                    {memory.likes_count}
                  </button>
                  <button 
                    onClick={() => setCommentingId(commentingId === memory.id ? null : memory.id)}
                    className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {memory.comments_count}
                  </button>
                </div>
              </div>

              {/* Comment Input */}
              {commentingId === memory.id && (
                <div className="mt-6 flex gap-2 animate-in slide-in-from-top-4 duration-300">
                  <Input 
                    placeholder="Drop a vibe..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="rounded-2xl bg-muted/50 border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button size="icon" className="h-10 w-10 rounded-2xl shrink-0" onClick={() => postComment.mutate(memory.id)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Memories;