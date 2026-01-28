import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Heart, MapPin, Send, BookOpenText, Music, Play, Pause, X, Share2, Volume2, VolumeX, RotateCcw, Maximize2, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// 1. Progress Bar Component
const VideoProgress = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => setProgress((video.currentTime / video.duration) * 100 || 0);
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [videoRef]);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
      <div className="h-full bg-primary transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  );
};

// 2. Main Reel Card Component
const ReelCard = ({ memory, user, toggleLike, handleShare, handlePlayPreview, playingUrl, postComment, newComment, setNewComment, isModal = false }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(!isModal);
  const [showComments, setShowComments] = useState(false);

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    setIsPaused(!isPaused);
  };

  return (
    <Card className={`h-full w-full relative overflow-hidden border-none bg-black ${isModal ? 'rounded-none md:rounded-3xl' : 'rounded-3xl'}`}>
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={handleVideoToggle}>
        {memory.media_type === 'video' ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} src={memory.media_url} className="w-full h-full object-cover" loop muted={isMuted} autoPlay playsInline />
            <VideoProgress videoRef={videoRef} />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-4 z-30">
              <div className="flex gap-4">
                <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40">
                  {isMuted ? <VolumeX className="h-6 w-6 text-red-400" /> : <Volume2 className="h-6 w-6" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); if(videoRef.current) videoRef.current.currentTime = 0; }} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40">
                  <RotateCcw className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <img src={memory.media_url} className="w-full h-full object-cover" alt="Memory" />
        )}
      </div>

      <div className="absolute top-4 left-4 z-20"><Badge className="bg-black/40 backdrop-blur-md text-white border-white/10 text-[9px] font-bold rounded-full"><MapPin className="h-3 w-3 mr-1 text-primary" /> {memory.location_name}</Badge></div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />

      <div className={`absolute inset-x-0 p-5 z-20 space-y-3 ${isModal ? 'bottom-12' : 'bottom-4'}`}>
        <div>
          <p className="text-xs font-black text-primary uppercase mb-1">{memory.username}</p>
          <p className={`${isModal ? 'text-lg' : 'text-sm'} font-bold text-white leading-snug line-clamp-2`}>"{memory.caption}"</p>
        </div>
        <div className="flex items-center gap-5 pt-1">
          <button onClick={(e) => { e.stopPropagation(); toggleLike.mutate({ memoryId: memory.id, isLiked: memory.is_liked }); }} className={`flex flex-col items-center gap-0.5 ${memory.is_liked ? 'text-red-500' : 'text-white'}`}><Heart className={`h-5 w-5 ${memory.is_liked ? 'fill-current' : ''}`} /><span className="text-[9px] font-bold">{memory.likes_count}</span></button>
          <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-0.5 text-white"><MessageSquare className="h-5 w-5" /><span className="text-[9px] font-bold">{memory.comments_count}</span></button>
          <button onClick={(e) => { e.stopPropagation(); handleShare(memory); }} className="flex flex-col items-center gap-0.5 text-white ml-auto"><Share2 className="h-5 w-5" /></button>
        </div>
      </div>

      {showComments && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-40 flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 flex justify-between items-center border-b border-white/10 text-white">
            <span className="text-xs font-black uppercase">Comments</span>
            <button onClick={() => setShowComments(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {memory.comments.map((c: any) => (
              <div key={c.id} className="flex gap-3 text-white">
                <Avatar className="h-6 w-6"><AvatarImage src={c.profiles?.avatar_url} /><AvatarFallback>{c.profiles?.username?.[0]}</AvatarFallback></Avatar>
                <div><p className="text-[10px] font-black text-primary">{c.profiles?.username}</p><p className="text-xs text-white/80">{c.content}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const Memories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Navigation State
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['communityMemories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_memories' as any).select(`*, activities (title, location), profiles (username, avatar_url), memory_likes (user_id), memory_comments (id, content, created_at, profiles (username, avatar_url))`).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({ ...item, activity_title: item.activities?.title || "Adventure", location_name: item.activities?.location || "South Africa", username: item.profiles?.username || "Explorer", avatar_url: item.profiles?.avatar_url, likes_count: item.memory_likes?.length || 0, comments_count: item.memory_comments?.length || 0, is_liked: item.memory_likes?.some((l: any) => l.user_id === user?.id), comments: item.memory_comments || [] }));
    },
  });

  const nextReel = () => { if (activeModalIndex !== null && activeModalIndex < memories.length - 1) setActiveModalIndex(activeModalIndex + 1); };
  const prevReel = () => { if (activeModalIndex !== null && activeModalIndex > 0) setActiveModalIndex(activeModalIndex - 1); };

  // Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => touchStart.current = e.touches[0].clientY;
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const distance = touchStart.current - e.changedTouches[0].clientY;
    if (distance > 50) nextReel();
    if (distance < -50) prevReel();
    touchStart.current = null;
  };

  const toggleLike = useMutation({
    mutationFn: async ({ memoryId, isLiked }: any) => {
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
    onSuccess: () => { setNewComment(""); queryClient.invalidateQueries({ queryKey: ['communityMemories'] }); }
  });

  const handlePlayPreview = (url: string) => {
    if (playingUrl === url) { audioRef.current?.pause(); setPlayingUrl(null); }
    else if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingUrl(url); }
  };

  const handleShare = async (memory: any) => {
    const shareData = { title: `WonderConnect`, text: `Check this out!`, url: window.location.href };
    if (navigator.share) navigator.share(shareData);
  };

  if (isLoading) return <div className="p-8 grid grid-cols-2 md:grid-cols-5 gap-4 bg-black">{[1,2,3,4,5].map(i => <Skeleton key={i} className="aspect-[9/16] rounded-2xl bg-white/10" />)}</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <BookOpenText className="h-8 w-8 text-primary" />
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tribe Reels</h1>
          </div>
          <p className="text-gray-500 text-lg mb-6">
            Join exciting travel events and meet like-minded adventurers
          </p>
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />
        
        {/* Grid Section - Now properly separated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
          {memories?.map((memory, index) => (
            <div key={memory.id} className="group cursor-pointer transform transition-all hover:scale-[1.02]" onClick={() => setActiveModalIndex(index)}>
                <div className="relative aspect-[9/16] pointer-events-none">
                    <ReelCard memory={memory} isModal={false} />
                    <div className="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="text-white h-8 w-8" /></div>
                </div>
            </div>
          ))}
        </div>

        {/* Modal Logic */}
        <Dialog open={activeModalIndex !== null} onOpenChange={() => setActiveModalIndex(null)}>
          <DialogContent 
            className="max-w-[95vw] md:max-w-[420px] p-0 border-none bg-transparent h-[90vh] focus:outline-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={(e) => { e.deltaY > 0 ? nextReel() : prevReel(); }}
          >
            {activeModalIndex !== null && (
              <div className="relative h-full animate-in fade-in zoom-in duration-300">
                <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 text-white/50 hidden md:flex">
                    <button onClick={prevReel} className="hover:text-primary"><ChevronUp /></button>
                    <button onClick={nextReel} className="hover:text-primary"><ChevronDown /></button>
                </div>

                <ReelCard 
                  memory={memories[activeModalIndex]} 
                  user={user} 
                  toggleLike={toggleLike} 
                  handleShare={handleShare} 
                  handlePlayPreview={handlePlayPreview} 
                  playingUrl={playingUrl} 
                  postComment={postComment} 
                  newComment={newComment} 
                  setNewComment={setNewComment}
                  isModal={true}
                />
                <div className="absolute -bottom-10 left-0 right-0 text-center text-white/40 text-[10px] uppercase font-bold tracking-widest animate-bounce">
                  Swipe up for more
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Memories;