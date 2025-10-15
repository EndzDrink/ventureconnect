import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface JoinActivityDialogProps {
  children: React.ReactNode;
  activityTitle: string;
  category: string;
  onJoin?: () => void;
}

export const JoinActivityDialog = ({ children, activityTitle, category, onJoin }: JoinActivityDialogProps) => {
  const [open, setOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Adventure Joined!",
      description: `You've successfully joined ${activityTitle}. We'll contact you soon!`
    });
    setOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: "",
      specialRequests: "",
      emergencyContact: "",
      agreeTerms: false
    });
    
    // Call the onJoin callback if provided
    onJoin?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join {activityTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
            <Input
              id="emergencyContact"
              required
              value={formData.emergencyContact}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
              placeholder="Name and phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests/Dietary Restrictions</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special requests, dietary restrictions, or medical conditions we should know about..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeTerms}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: checked as boolean }))}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the terms and conditions and liability waiver
            </Label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Join Adventure
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};