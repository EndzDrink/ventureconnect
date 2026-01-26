import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Upload, X, Globe, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateActivityDialogProps {
  children: React.ReactNode;
}

export const CreateActivityDialog = ({ children }: CreateActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    lat: "", // New Field
    lng: "", // New Field
    maxParticipants: "",
    duration: "",
    meetingPoint: "",
    whatToBring: "",
    difficulty: "",
    price: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('activity-images')
      .upload(fileName, imageFile);
    if (error) return null;
    const { data } = supabase.storage.from('activity-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Authentication Required", variant: "destructive" });
      return;
    }
    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase
        .from('activities')
        .insert([{
          title: formData.title,
          description: formData.description,
          location: formData.location,
          lat: formData.lat ? parseFloat(formData.lat) : null, // Precision Mapping
          lng: formData.lng ? parseFloat(formData.lng) : null, // Precision Mapping
          creator_id: user.id,
          category: formData.category,
          date: date ? format(date, "yyyy-MM-dd") : null, 
          max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          duration: formData.duration,
          price: formData.price,
          meeting_point: formData.meetingPoint,
          what_to_bring: formData.whatToBring,
          difficulty: formData.difficulty,
          image_url: imageUrl
        }]);

      if (error) throw error;

      toast({ title: "Activity Created!", description: `${formData.title} is now live.` });
      setOpen(false);
      setFormData({
        title: "", description: "", category: "", location: "",
        lat: "", lng: "", maxParticipants: "", duration: "",
        meetingPoint: "", whatToBring: "", difficulty: "", price: ""
      });
      setDate(new Date());
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Adventure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Sunset Hike at Mount Wilson"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hiking">Hiking</SelectItem>
                  <SelectItem value="food">Food & Beverages</SelectItem>
                  <SelectItem value="water-sports">Water Sports</SelectItem>
                  <SelectItem value="culture">Arts & Culture</SelectItem>
                  <SelectItem value="nightlife">Social</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your adventure..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Activity Image</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <Label htmlFor="image-upload" className="cursor-pointer mt-2 block">
                  <span className="text-primary font-medium">Click to upload</span>
                </Label>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} className="w-full h-48 object-cover rounded-lg" />
                <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}><X className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
          
          {/* Location & Map Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location (City/Region) *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Durban, South Africa"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Precise Coordinates Section */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-primary">
                <Globe className="h-4 w-4" /> Precise Map Coordinates (Optional)
              </Label>
              <a 
                href="https://www.google.com/maps" 
                target="_blank" 
                className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
              >
                Find on Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="lat" className="text-[10px] uppercase text-muted-foreground">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="-29.8587"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng" className="text-[10px] uppercase text-muted-foreground">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="31.0218"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Adding coordinates helps users find the exact starting point on the map.
            </p>
          </div>
          
          {/* Stats: Participants, Duration, Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input id="maxParticipants" type="number" value={formData.maxParticipants} onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))} placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))} placeholder="3 hours" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="25" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="challenging">Challenging</SelectItem>
                <SelectItem value="extreme">Extreme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meetingPoint">Meeting Point *</Label>
            <Input id="meetingPoint" required value={formData.meetingPoint} onChange={(e) => setFormData(prev => ({ ...prev, meetingPoint: e.target.value }))} placeholder="Exact address or landmark" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatToBring">What to Bring</Label>
            <Textarea id="whatToBring" value={formData.whatToBring} onChange={(e) => setFormData(prev => ({ ...prev, whatToBring: e.target.value }))} placeholder="List items..." rows={2} />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={uploading}>{uploading ? "Creating..." : "Create Adventure"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};