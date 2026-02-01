import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, ImagePlus, Loader2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea"; 

interface UserProfile {
  full_name: string | null;
  username: string | null;
  bio: string | null;
  next_trip: string | null;
  looking_for: string | null;
  bg_image_url: string | null; 
}

export const SettingsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [profileData, setProfileData] = useState<UserProfile>({
    full_name: "", username: "", bio: "", next_trip: "", looking_for: "", bg_image_url: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !open) return;
      setIsFetchingProfile(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, bio, next_trip, looking_for, bg_image_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfileData({
          full_name: data.full_name,
          username: data.username,
          bio: data.bio || '',
          next_trip: data.next_trip || '',
          looking_for: data.looking_for || '',
          bg_image_url: data.bg_image_url,
        });
      }
      setIsFetchingProfile(false);
    };
    fetchProfile();
  }, [user, open]);

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;
      setUploadingBanner(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile_banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile_banners')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ bg_image_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setProfileData(prev => ({ ...prev, bg_image_url: publicUrl }));
      toast({ title: "Success", description: "Banner updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name,
        bio: profileData.bio,
        next_trip: profileData.next_trip,
        looking_for: profileData.looking_for
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your travel profile.</DialogDescription>
        </DialogHeader>
        {isFetchingProfile ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Banner</Label>
              <div 
                className="h-28 w-full rounded-xl border-2 border-dashed flex items-center justify-center bg-cover bg-center"
                style={profileData.bg_image_url ? { backgroundImage: `url(${profileData.bg_image_url})` } : {}}
              >
                <label className="cursor-pointer flex flex-col items-center bg-white/60 p-2 rounded-lg backdrop-blur-sm">
                  {uploadingBanner ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                  <span className="text-xs font-bold">Change Image</span>
                  <input type="file" className="hidden" onChange={handleBannerUpload} accept="image/*" />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileData.full_name || ""} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profileData.username || ""} disabled className="bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={profileData.bio || ""} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;