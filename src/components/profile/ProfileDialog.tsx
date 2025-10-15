import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, User } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Your profile information and account details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-6">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user.user_metadata?.avatar_url || ""} 
              alt={user.user_metadata?.full_name || user.email || "User"} 
            />
            <AvatarFallback className="text-lg">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              {user.user_metadata?.full_name || "User"}
            </h3>
            <Badge variant="secondary">Traveler</Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>ID: {user.id.slice(0, 8)}...</span>
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