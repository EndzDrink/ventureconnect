import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Heart, MapPin, Send, BookOpenText, Music, Play, Pause, X, Share2, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// 1. Progress Bar Sub-component
const VideoProgress = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      const value = (video.currentTime / video.duration) * 100;
      setProgress(value || 0);
    };
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [videoRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
      <div className="h-full bg-primary transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  );
};

// 2. Individual Reel Sub-component (FIXES THE "BREAKING" HOOK ISSUE)
const ReelCard = ({ memory, user, toggleLike, setShowCommentsId, showCommentsId, handleShare, handlePlayPreview, playingUrl, postComment, newComment, setNewComment }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleRewind = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative aspect-[9/16] group">
      <Card className="h-full w-full relative overflow-hidden rounded-3xl border-none shadow-2xl bg-black">
        <div className="absolute inset-0 z-0 cursor-pointer" onClick={handleVideoToggle}>
          {memory.media_type === 'video' ? (
            <div className="relative w-full h-full">
              <video ref={videoRef} src={memory.media_url} className="w-full h-full object-cover" loop muted={isMuted} autoPlay playsInline />
              <VideoProgress videoRef={videoRef} />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-4 z-30">
                <div className="flex gap-4">
                  <button onClick={handleToggleMute} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40">
                    {isMuted ? <VolumeX className="h-6 w-6 text-red-400" /> : <Volume2 className="h-6 w-6" />}
                  </button>
                  <button onClick={handleRewind} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40">
                    <RotateCcw className="h-6 w-6" />
                  </button>
                </div>
                {isPaused && <Play className="h-12 w-12 text-white/70 animate-pulse" />}
              </div>
            </div>
          ) : (
            <img src={memory.media_url} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" alt="Memory" />
          )}
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <Badge className="bg-black/40 backdrop-blur-md text-white border-white/10 text-[9px] font-bold rounded-full px-2 py-0.5">
            <MapPin className="h-3 w-3 mr-1 text-primary" /> {memory.location_name}
          </Badge>
          <div className="h-8 w-8 rounded-full border-2 border-primary/50 overflow-hidden">
            <Avatar className="h-full w-full"><AvatarImage src={memory.avatar_url} /><AvatarFallback>{memory.username[0]}</AvatarFallback></Avatar>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />

        <div className="absolute bottom-4 inset-x-0 p-5 z-20 space-y-3">
          {memory.song_data && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/10 p-1.5 rounded-full max-w-full">
              <div className="relative h-6 w-6 shrink-0">
                <img src={memory.song_data.cover} className={`h-full w-full rounded-full ${playingUrl === memory.song_data.preview_url ? 'animate-spin-slow' : ''}`} />
                <button onClick={(e) => { e.stopPropagation(); handlePlayPreview(memory.song_data.preview_url); }} className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  {playingUrl === memory.song_data.preview_url ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-[9px] font-black uppercase truncate pr-2">{memory.song_data.title}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-black text-primary uppercase mb-1">{memory.username}</p>
            <p className="text-sm font-bold text-white leading-snug line-clamp-2">"{memory.caption}"</p>
          </div>

          <div className="flex items-center gap-5 pt-1">
            <button onClick={(e) => { e.stopPropagation(); toggleLike.mutate({ memoryId: memory.id, isLiked: memory.is_liked }); }} className={`flex flex-col items-center gap-0.5 transition-all ${memory.is_liked ? 'text-red-500' : 'text-white'}`}>
              <Heart className={`h-5 w-5 ${memory.is_liked ? 'fill-current' : ''}`} /><span className="text-[9px] font-bold">{memory.likes_count}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowCommentsId(memory.id); }} className="flex flex-col items-center gap-0.5 text-white">
              <MessageSquare className="h-5 w-5" /><span className="text-[9px] font-bold">{memory.comments_count}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleShare(memory); }} className="flex flex-col items-center gap-0.5 text-white ml-auto">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 4. Comments Overlay */}
        {showCommentsId === memory.id && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-widest">Vibe Check ({memory.comments_count})</span>
              <button onClick={() => setShowCommentsId(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {memory.comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-6 w-6"><AvatarImage src={c.profiles?.avatar_url} /><AvatarFallback>{c.profiles?.username?.[0]}</AvatarFallback></Avatar>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-primary">{c.profiles?.username}</p>
                    <p className="text-xs text-white/80 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-black/40 border-t border-white/10">
              <div className="flex gap-2">
                <Input placeholder="Say something..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="h-9 bg-white/10 border-none rounded-xl text-xs" />
                <Button size="icon" className="h-9 w-9 rounded-xl bg-primary" onClick={() => postComment.mutate(memory.id)}><Send className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const Memories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCommentsId, setShowCommentsId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['communityMemories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_memories' as any).select(`*, activities (title, location), profiles (username, avatar_url), memory_likes (user_id), memory_comments (id, content, created_at, profiles (username, avatar_url))`).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({ ...item, activity_title: item.activities?.title || "Adventure", location_name: item.activities?.location || "South Africa", username: item.profiles?.username || "Explorer", avatar_url: item.profiles?.avatar_url, likes_count: item.memory_likes?.length || 0, comments_count: item.memory_comments?.length || 0, is_liked: item.memory_likes?.some((l: any) => l.user_id === user?.id), comments: item.memory_comments || [] }));
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ memoryId, isLiked }: { memoryId: string, isLiked: boolean }) => {
      if (isLiked) await supabase.from('memory_likes' as any).delete().eq('memory_id', memoryId).eq('user_id', user?.id);
      else await supabase.from('memory_likes' as any).insert({ memory_id: memoryId, user_id: user?.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityMemories'] }),
  });

  const postComment = useMutation({
    mutationFn: async (memoryId: string) => {
      if (!newComment.trim()) return;
      await supabase.from('memory_comments' as any).insert({ memory_id: memoryId, user_id: user?.id, content: newComment });
    },
    onSuccess: () => { setNewComment(""); queryClient.invalidateQueries({ queryKey: ['communityMemories'] }); toast({ title: "Comment shared!" }); }
  });

  const handlePlayPreview = (url: string) => {
    if (playingUrl === url) { audioRef.current?.pause(); setPlayingUrl(null); }
    else if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingUrl(url); }
  };

  const handleShare = async (memory: any) => {
    const shareData = { title: `WonderConnect: ${memory.activity_title}`, text: `Check out this memory from ${memory.username}`, url: window.location.href };
    try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); } } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-[#0f0f0f]">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="aspect-[9/16] w-full rounded-2xl bg-white/10" />)}</div>;

  return (
    <div className="min-h-screen pb-20 text-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpenText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Tribe Reels</h1>
          </div>
          <p className="text-muted-foreground text-lg">The soundtrack of the wild</p>
        </div>
        <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {memories?.map((memory) => (
            <ReelCard 
              key={memory.id} 
              memory={memory} 
              user={user} 
              toggleLike={toggleLike} 
              showCommentsId={showCommentsId} 
              setShowCommentsId={setShowCommentsId} 
              handleShare={handleShare} 
              handlePlayPreview={handlePlayPreview} 
              playingUrl={playingUrl} 
              postComment={postComment} 
              newComment={newComment} 
              setNewComment={setNewComment} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Memories;