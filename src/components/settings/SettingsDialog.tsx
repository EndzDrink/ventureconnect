import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Save, Shield, Bell, Eye, User } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or need to define it

// Define the shape of the data we expect from the profiles table
interface UserProfile {
  full_name: string | null;
  username: string;
  bio: string | null;
  next_trip: string | null;
  looking_for: string | null;
  // We'll skip rating/trips since users can't typically update these directly
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  
  // State for user profile details (from the 'profiles' table)
  const [profileData, setProfileData] = useState<UserProfile>({
    full_name: user?.user_metadata?.full_name || "",
    username: user?.user_metadata?.username || "",
    bio: "",
    next_trip: "",
    looking_for: "",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: true,
  });

  // Function to fetch the user's complete profile data on dialog open
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !open) return;
      setIsFetchingProfile(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(`full_name, username, bio, next_trip, looking_for`)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile for settings:', error);
        toast({
          title: "Error loading profile",
          description: "Could not load complete profile details.",
          variant: "destructive",
        });
      } else if (data) {
        setProfileData({
          full_name: data.full_name,
          username: data.username,
          bio: data.bio || '',
          next_trip: data.next_trip || '',
          looking_for: data.looking_for || '',
        });
      }
      setIsFetchingProfile(false);
    };

    fetchProfile();
  }, [user, open, toast]);


  // Handler for Profile Settings form submission
  const handleUpdateProfileDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const updates = {
      full_name: profileData.full_name,
      bio: profileData.bio,
      next_trip: profileData.next_trip,
      looking_for: profileData.looking_for,
      // Note: username should typically be changed via a specific Supabase function/policy
      // We assume full_name is stored in the profiles table for simplicity here.
    };

    try {
      // 1. Update the 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (profileError) throw profileError;

      // 2. Optionally, update the auth metadata (e.g., if full_name is also stored there)
      /* const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profileData.full_name }
      });
      if (authError) throw authError;
      */
      
      toast({
        title: "Profile updated",
        description: "Your public profile details have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please ensure RLS policies allow the update.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    // Replaced confirm() with a non-blocking toast message
    toast({
      title: "Account Deletion Policy",
      description: "For security, please contact support directly to delete your account.",
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and travel profile.
          </DialogDescription>
        </DialogHeader>
        
        {isFetchingProfile ? (
          <div className="flex justify-center items-center h-48">
            <User className="h-8 w-8 animate-pulse text-indigo-600" />
            <p className="ml-3 text-lg text-gray-600">Loading Profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Settings (Expanded) */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Account & Public Profile
              </h3>
              
              <form onSubmit={handleUpdateProfileDetails} className="space-y-4">
                
                {/* Basic Auth Details */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user.email || ""} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your email cannot be changed here.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    value={profileData.username || ""} 
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your unique identifier.
                  </p>
                </div>

                <Separator />
                <h4 className="font-semibold mt-6 mb-3 text-sm text-gray-700">Travel Buddy Profile Details</h4>
                
                {/* New Profile Fields */}
                <div>
                  <Label htmlFor="full_name">Full Name (Public)</Label>
                  <Input 
                    id="full_name" 
                    name="full_name"
                    type="text" 
                    value={profileData.full_name || ""} 
                    onChange={(e) => setProfileData(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio || ""}
                    onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell other travelers about yourself (max 150 chars)"
                    maxLength={150}
                  />
                </div>

                <div>
                  <Label htmlFor="next_trip">Next Trip Destination</Label>
                  <Input 
                    id="next_trip" 
                    type="text" 
                    value={profileData.next_trip || ""} 
                    onChange={(e) => setProfileData(p => ({ ...p, next_trip: e.target.value }))}
                    placeholder="e.g., Tokyo, Japan or Southeast Asia"
                  />
                </div>

                <div>
                  <Label htmlFor="looking_for">Looking For</Label>
                  <Input 
                    id="looking_for" 
                    type="text" 
                    value={profileData.looking_for || ""} 
                    onChange={(e) => setProfileData(p => ({ ...p, looking_for: e.target.value }))}
                    placeholder="e.g., Budget-friendly companions or adventure seekers"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving Profile..." : "Save Public Profile Details"}
                </Button>
              </form>
            </div>

            <Separator />

            {/* Notification Settings */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive activity updates via email
                    </p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Privacy Settings */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Privacy
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-xs text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch 
                  checked={settings.profileVisibility}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, profileVisibility: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Danger Zone
              </h3>
              
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="w-full"
              >
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This action cannot be undone.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;