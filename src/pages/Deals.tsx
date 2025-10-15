import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Clock, MapPin, Star } from "lucide-react";

import { useQuery } from '@tanstack/react-query';
// FIX: Changing path alias to relative path as a fallback
import { supabase } from '../integrations/supabase/client'; 

// --- Types ---

// Define the TypeScript interface for a Deal
interface Deal {
  id: string; 
  title: string;
  description: string;
  original_price: number; 
  discount_price: number;
  location: string;
  rating: number;
  reviews: number;
  is_urgent: boolean; 
  time_left: string;
  discount_percentage: number; 
}

// Interface for the component props (to satisfy ProtectedRoute)
interface DealsPageProps {
  userId: string; // Required by ProtectedRoute, even if not used here
}


// --- Data Fetching ---

// Define the data fetching function
const fetchDeals = async (): Promise<Deal[]> => {
  const { data, error } = await supabase
    // FIX 1 (Error 2769): Cast table name to 'any' to bypass stale local types
    .from('deals' as any) 
    .select(`
      id, 
      title, 
      description, 
      location, 
      rating, 
      reviews,
      is_urgent,
      time_left,
      original_price,
      discount_price,
      discount_percentage
    `)
    .order('is_urgent', { ascending: false });

  if (error) {
    // Log the error for runtime debugging
    console.error("Supabase Deal Fetch Error:", error.message);
    throw new Error(error.message);
  }
  
  // FIX 2 (Error 2352): Cast data to 'unknown' first, then to Deal[] 
  // to resolve the strict conversion error.
  return data as unknown as Deal[]; 
};


// --- Component ---

const Deals: React.FC<DealsPageProps> = ({ userId }) => { // Accept the userId prop
  const { data: deals, isLoading, isError, error } = useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
  });

  // FIX: Removed redundant Navbar component from loading and error states
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
  
  const calculateDiscount = (original: number, discount: number) => {
    if (original === 0) return 0;
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
              const discountPercent = calculateDiscount(deal.original_price, deal.discount_price);
              
              return (
                <Card key={deal.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  {deal.is_urgent && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="destructive" className="gap-1 font-semibold text-xs py-1 px-2 shadow-md">
                        <Clock className="h-3 w-3" />
                        {deal.time_left}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl mb-2 leading-tight">{deal.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {deal.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{deal.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="font-semibold">{deal.rating}</span>
                        <span className="text-muted-foreground">({deal.reviews})</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-extrabold text-primary">
                            {formatCurrency(deal.discount_price)}
                          </span>
                          <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
                            -{discountPercent}% OFF
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(deal.original_price)}
                        </span>
                      </div>
                      
                      <Button className="ml-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md">
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
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
