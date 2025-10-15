import { useState } from "react";
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
import { AlertTriangle, Save, Shield, Bell, Eye } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: true,
  });

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    toast({
      title: "Account deletion",
      description: "Please contact support to delete your account.",
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Profile Settings
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  Contact support to change your email address
                </p>
              </div>
              
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName"
                  type="text" 
                  defaultValue={user.user_metadata?.full_name || ""} 
                  placeholder="Enter your full name"
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
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
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
        </div>
        
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
