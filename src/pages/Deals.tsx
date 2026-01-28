import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Clock, MapPin, Star } from "lucide-react";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client'; 
// Import the necessary type helper from the database definition file
import type { Tables } from '../database.types'; 

// --- Types ---

// TEMPORARY FIX: Extend the automatically generated type to include 'image_url'
// This is needed because the database was updated after the types file was generated.
// The long-term fix is to regenerate database.types.ts using the Supabase CLI.
type Deal = Tables<'deals'> & {
  image_url: string | null;
};

// Interface for the component props (to satisfy ProtectedRoute)
interface DealsPageProps {
  userId: string; // Required by ProtectedRoute, even if not used here
}


// --- Data Fetching ---

// Define the data fetching function
const fetchDeals = async (): Promise<Deal[]> => {
  // We need to explicitly cast the result to the Deal[] type for the temporary fix above
  const { data, error } = await supabase
    .from('deals') 
    .select('*') 
    .order('is_urgent', { ascending: false });

  if (error) {
    console.error("Supabase Deal Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // Log the data to the console to confirm successful retrieval and check its contents
  console.log("Fetched Deals Data:", data);

  // Cast the data to Deal[] to satisfy the function return type
  return data as Deal[]; 
};


// --- Component ---

const Deals: React.FC<DealsPageProps> = ({ userId }) => {
  const { data: deals, isLoading, isError, error } = useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-16 text-center">Loading deals...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-16 text-center text-red-500">
          Error loading deals: {error?.message}
        </div>
      </div>
    );
  }
  
  const dealsData = deals || [];

  const formatCurrency = (amount: number) => {
    // Assuming ZAR currency format from your mock data
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Note: This function requires non-null numbers for calculation, so we handle nulls before calling it.
  const calculateDiscount = (original: number, discount: number) => {
    if (original <= 0) return 0;
    return Math.round(((original - discount) / original) * 100);
  }

  return (
    <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-8 w-8 text-primary" />
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Travel Deals</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Discover amazing travel deals and save big on your next adventure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealsData.map((deal) => {
              // Using null-coalescing on all nullable fields defined in database.types.ts
              const title = deal.title ?? 'Unknown Deal';
              const description = deal.description ?? 'No description provided.';
              const location = deal.location ?? 'Worldwide';
              const rating = deal.rating ?? 0;
              const reviews = deal.reviews ?? 0;
              const isUrgent = deal.is_urgent ?? false;
              // Ensure time_left is a string or fallback to a string
              const timeLeft = deal.time_left ? String(deal.time_left) : 'Limited Time';
              
              // Now TypeScript knows about image_url
              const imageUrl = deal.image_url ?? `https://placehold.co/600x400/1e293b/ffffff?text=${encodeURIComponent(title)}`;
              
              const originalPrice = deal.original_price ?? 0;
              const discountPrice = deal.discount_price ?? 0;
              
              const discountPercent = calculateDiscount(originalPrice, discountPrice);
              
              if (!title) return null;

              const hasPrice = originalPrice > 0 || discountPrice > 0;
              
              return (
                <Card key={deal.id} className="group relative overflow-hidden border-none shadow-xl bg-white rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
  
  {/* --- IMAGE BLOCK --- */}
  <div className="relative h-64 overflow-hidden">
    <img 
      src={imageUrl} 
      alt={`Image for ${title}`} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      onError={(e) => {
        (e.target as HTMLImageElement).onerror = null;
        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1e293b/ffffff?text=Image+Missing`;
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    
    {/* Urgency Badge */}
    {isUrgent && (
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-red-500 hover:bg-red-600 border-none text-[10px] font-black uppercase px-3 py-1 shadow-lg animate-pulse">
          <Clock className="h-3 w-3 mr-1" /> {timeLeft}
        </Badge>
      </div>
    )}

    {/* Rating Tag */}
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-3 py-1 flex items-center gap-1">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
      </div>
    </div>

    {/* Discount Floating Tag */}
    {discountPercent > 0 && (
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-primary text-white font-black text-xs px-4 py-1 rounded-full shadow-lg">
          {discountPercent}% OFF
        </div>
      </div>
    )}
  </div>
  
  <CardHeader className="pt-6 space-y-2">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
      <MapPin className="h-3 w-3" />
      {location}
    </div>
    <div>
      <CardTitle className="text-2xl font-bold text-slate-800 leading-tight mb-1">{title}</CardTitle>
      <CardDescription className="text-sm line-clamp-2 text-slate-500 italic">
        {description}
      </CardDescription>
    </div>
  </CardHeader>
  
  <CardContent className="pb-8">
    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-slate-100/50">
      <div className="flex flex-col">
        {hasPrice ? (
          <>
            {originalPrice > discountPrice && (
              <span className="text-xs text-slate-400 line-through font-bold">
                {formatCurrency(originalPrice)}
              </span>
            )}
            <span className="text-2xl font-black text-slate-900 tracking-tighter">
              {formatCurrency(discountPrice)}
            </span>
          </>
        ) : (
          <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Exclusive</span>
        )}
      </div>
      
      <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs rounded-xl px-6 h-12 shadow-[0_10px_20px_-10px_rgba(234,88,12,0.5)] transition-all group-hover:px-8">
        {hasPrice ? "Book Now" : "Inquire"}
      </Button>
    </div>
  </CardContent>

  {/* Visual "Ticket" Cut-outs */}
  <div className="absolute left-[-10px] top-[60%] h-5 w-5 bg-background rounded-full border-r border-slate-100 shadow-inner" />
  <div className="absolute right-[-10px] top-[60%] h-5 w-5 bg-background rounded-full border-l border-slate-100 shadow-inner" />
</Card>
              );
            })}
          </div>
          
          {dealsData.length === 0 && !isLoading && (
            <div className="text-center mt-10 p-10 text-muted-foreground border border-dashed rounded-xl">
              <Tag className="h-6 w-6 mx-auto mb-3" />
              <p>No deals currently available. Check back soon!</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default Deals;
