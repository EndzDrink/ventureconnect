import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Camera, Music, Search, Disc, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const PostMemoryDialog = ({ activityId, activityTitle }: { activityId: string, activityTitle: string }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Music Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch Spotify Token (valid for 1 hour)
  const fetchSpotifyToken = async () => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(import.meta.env.VITE_SPOTIFY_CLIENT_ID + ':' + import.meta.env.VITE_SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      });
      const data = await response.json();
      setSpotifyToken(data.access_token);
    } catch (error) {
      console.error("Spotify Auth Error:", error);
    }
  };

  useEffect(() => {
    if (open && !spotifyToken) fetchSpotifyToken();
  }, [open]);

  // Real-time Search Logic
  useEffect(() => {
    const searchTracks = async () => {
      if (!searchQuery || searchQuery.length < 2 || !spotifyToken) return;
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`, {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const data = await res.json();
        setSearchResults(data.tracks.items || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchTracks, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, spotifyToken]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('event-memories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('event-memories')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('event_memories' as any)
        .insert([{
          activity_id: activityId,
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          caption,
          song_data: selectedSong ? {
            title: selectedSong.name,
            artist: selectedSong.artists[0].name,
            cover: selectedSong.album.images[0]?.url,
            preview_url: selectedSong.preview_url
          } : null
        }]);

      if (dbError) throw dbError;

      toast({ title: "Memory shared with the tribe!" });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null); setPreview(null); setCaption("");
    setSelectedSong(null); setSearchQuery(""); setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5">
          <Camera className="h-4 w-4 text-primary" /> Share Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader><DialogTitle>Post to {activityTitle}</DialogTitle></DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Media Upload */}
          {!preview ? (
            <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/20">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <Label htmlFor="memory-file" className="cursor-pointer text-primary font-bold">Pick Photo/Video</Label>
              <input id="memory-file" type="file" accept="image/*,video/*" className="hidden" 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                }} 
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              {file?.type.startsWith('video/') ? <video src={preview} controls className="w-full h-full" /> : <img src={preview} className="w-full h-full object-cover" />}
              <Button size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full" onClick={() => {setFile(null); setPreview(null);}}><X className="h-4 w-4" /></Button>
            </div>
          )}

          {/* Spotify Search Bar */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground"><Music className="h-3 w-3" /> Background Music</Label>
            
            {!selectedSong ? (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Spotify tracks..." 
                  className="pl-9 rounded-xl h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/20">
                <img src={selectedSong.album.images[0]?.url} className="h-10 w-10 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{selectedSong.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedSong.artists[0].name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedSong(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && !selectedSong && (
              <div className="border rounded-2xl overflow-hidden bg-popover shadow-xl max-h-48 overflow-y-auto">
                {searchResults.map((track) => (
                  <button key={track.id} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left border-b last:border-0" onClick={() => setSelectedSong(track)}>
                    <img src={track.album.images[2]?.url} className="h-8 w-8 rounded shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artists[0].name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Textarea placeholder="What's the vibe?" value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-2xl resize-none min-h-[100px]" />

          <Button className="w-full rounded-2xl h-12 font-black text-lg" disabled={!file || loading} onClick={handleUpload}>
            {loading ? <Loader2 className="animate-spin" /> : "POST MEMORY"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};