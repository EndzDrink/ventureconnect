import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JoinActivityDialogProps {
  children: React.ReactNode;
  activityTitle: string;
  activityId: string; // Required for DB
  userId: string;     // Required for DB
  category: string;
  onJoin?: () => void;
}

export const JoinActivityDialog = ({ 
  children, 
  activityTitle, 
  activityId, 
  userId, 
  onJoin 
}: JoinActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    specialRequests: "",
    emergencyContact: "",
    agreeTerms: false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      toast({ title: "Agreement Required", description: "Please agree to the terms.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    // REAL DATABASE INSERT
    const { error } = await supabase
      .from('activity_participants' as any)
      .insert([{ activity_id: activityId, user_id: userId }]);

    if (error) {
      toast({ title: "Error", description: "Could not join activity. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Adventure Joined!", description: `You've joined ${activityTitle}!` });
      onJoin?.();
      setOpen(false);
      setFormData({ name: "", email: "", phone: "", experience: "", specialRequests: "", emergencyContact: "", agreeTerms: false });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col max-w-md max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border/50 flex-shrink-0">
          <DialogTitle>Join {activityTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="join-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone Number *</Label><Input id="phone" required value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select onValueChange={(v) => setFormData(prev => ({ ...prev, experience: v }))}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(c) => setFormData(prev => ({ ...prev, agreeTerms: !!c }))} />
              <Label htmlFor="terms" className="text-sm">I agree to terms</Label>
            </div>
          </form>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-border/50 flex-shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
          <Button type="submit" form="join-form" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Joining..." : "Join Adventure"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};