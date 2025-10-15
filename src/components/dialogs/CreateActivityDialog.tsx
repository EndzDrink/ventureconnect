import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateActivityDialogProps {
  children: React.ReactNode;
}

export const CreateActivityDialog = ({ children }: CreateActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  // Set date to today by default
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
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
      .from('activity-images') // Must match your Supabase bucket name
      .upload(fileName, imageFile);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('activity-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create activities.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast({
            title: "Upload Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive"
          });
          setUploading(false);
          return;
        }
      }

      // --- CRITICAL FIX: INSERTING ALL FORM DATA ---
      const { error } = await supabase
        .from('activities')
        .insert([{
          title: formData.title,
          description: formData.description,
          location: formData.location,
          creator_id: user.id,

          // Map all form data to snake_case DB columns
          category: formData.category,
          // Format date for the database (e.g., "2025-10-08")
          date: date ? format(date, "yyyy-MM-dd") : null, 
          // Parse maxParticipants to a number, or null if empty
          max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          duration: formData.duration,
          price: formData.price,
          meeting_point: formData.meetingPoint, // DB column: meeting_point
          what_to_bring: formData.whatToBring, // DB column: what_to_bring
          difficulty: formData.difficulty,
          
          // Image URL from successful upload
          image_url: imageUrl // DB column: image_url
        }]);

      if (error) throw error;

      toast({
        title: "Activity Created!",
        description: `${formData.title} has been successfully created and is now live.`
      });
      
      // Reset form state and close dialog
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        maxParticipants: "",
        duration: "",
        meetingPoint: "",
        whatToBring: "",
        difficulty: "",
        price: ""
      });
      setDate(new Date());
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Adventure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hiking">Hiking</SelectItem>
                  <SelectItem value="food">Food & Drinks</SelectItem>
                  <SelectItem value="water-sports">Water Sports</SelectItem>
                  <SelectItem value="culture">Culture & Arts</SelectItem>
                  <SelectItem value="nightlife">Nightlife</SelectItem>
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
              placeholder="Describe your adventure in detail..."
              rows={3}
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Activity Image</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div className="mt-2">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-primary font-medium">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </Label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                  placeholder="10"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="3 hours"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (ZAR)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="25"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Anyone can join</SelectItem>
                <SelectItem value="moderate">Moderate - Some fitness required</SelectItem>
                <SelectItem value="challenging">Challenging - Good fitness level needed</SelectItem>
                <SelectItem value="extreme">Extreme - Expert level only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meetingPoint">Meeting Point *</Label>
            <Input
              id="meetingPoint"
              required
              value={formData.meetingPoint}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingPoint: e.target.value }))}
              placeholder="Exact address or landmark"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatToBring">What to Bring</Label>
            <Textarea
              id="whatToBring"
              value={formData.whatToBring}
              onChange={(e) => setFormData(prev => ({ ...prev, whatToBring: e.target.value }))}
              placeholder="List items participants should bring..."
              rows={2}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? "Creating..." : "Create Adventure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};