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
    <div className="min-h-screen bg-background">
      {/* NavBar is now handled by the NavLayout wrapper in App.tsx */}
      
      <div className="pt-8 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Travel Deals</h1>
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
                <Card key={deal.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  
                  {/* --- IMAGE BLOCK --- */}
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`Image for ${title}`} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      // Fallback image in case the URL is invalid or the image fails to load
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null; // prevents infinite loop
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1e293b/ffffff?text=Image+Missing`;
                      }}
                    />
                  </div>
                  {/* --- END IMAGE BLOCK --- */}
                  
                  {isUrgent && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="destructive" className="gap-1 font-semibold text-xs py-1 px-2 shadow-md">
                        <Clock className="h-3 w-3" />
                        {timeLeft}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl mb-2 leading-tight">{title}</CardTitle>
                        <CardDescription className="text-sm">
                          {description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{location}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* We use Math.min(5, rating) just in case the rating field exceeds 5 */}
                        {Array.from({ length: Math.round(Math.min(5, rating)) }).map((_, i) => (
                           <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                        ))}
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({reviews})</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Only render CardContent if price data exists */}
                  {hasPrice && (
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-extrabold text-primary">
                              {formatCurrency(discountPrice)}
                            </span>
                            {discountPercent > 0 && (
                              <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                                -{discountPercent}% OFF
                              </Badge>
                            )}
                          </div>
                          {originalPrice > discountPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                        
                        <Button className="ml-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  )}
                  {!hasPrice && (
                      <CardContent className="pt-4">
                          <div className="flex items-center justify-end border-t pt-4">
                              <Button className="ml-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md">
                                  Inquire Now
                              </Button>
                          </div>
                      </CardContent>
                  )}
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
    </div>
  );
};

export default Deals;
