import { useSearchParams } from 'react-router-dom';
// import { useGlobalSearch } from '@/hooks/useGlobalSearch'; // Original problematic import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, ArrowRight } from "lucide-react"; // Added Search and ArrowRight icons
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from 'react'; // Added for mock hook

// --- MOCK HOOK DEFINITION ---
// Mock interface for the data structure the hook is expected to return
interface SearchResult { 
    id: string; 
    type: 'deal' | 'event' | 'travel_buddy' | 'featured_partner' | string; 
    title: string; 
    description: string; 
    link: string; 
}

// Mock implementation of useGlobalSearch to bypass the unresolved import error
const useGlobalSearch = (query: string) => {
    const [data, setData] = useState<SearchResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        // FIX: If the query is empty, immediately set data to empty and ensure loading is false.
        if (!query) {
            setData([]);
            setIsLoading(false); // Crucial fix: ensure loading state is false
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setData(null);

        // Simulate a network delay
        const timer = setTimeout(() => {
            if (query.toLowerCase().includes("cape")) {
                setData([
                    { id: '1', type: 'deal', title: '5-Day Cape Town Safari Package', description: 'Experience the Big Five and Table Mountain views.', link: '/deals/1' },
                    { id: '2', type: 'event', title: 'Cape Winelands Cycling Tour', description: 'A scenic ride through Stellenbosch vineyards.', link: '/events/2' },
                    { id: '3', type: 'travel_buddy', title: 'Looking for partner in Cape Town', description: 'Hiking Table Mountain next month.', link: '/buddies/3' },
                ]);
            } else if (query.toLowerCase().includes("party")) {
                 setData([
                    { id: '4', type: 'event', title: 'Full Moon Beach Party', description: 'Dance the night away on a tropical beach.', link: '/events/4' },
                ]);
            } else {
                // No results found
                setData([]);
            }
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [query]);

    return { data, isLoading, isError };
};
// ----------------------------

// NEW: Define props interface to accept 'userId'
interface SearchResultsProps {
  userId: string;
}


// NEW: Update function signature to accept and destructure 'userId'
export default function SearchResults({ userId }: SearchResultsProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results, isLoading, isError } = useGlobalSearch(query);

  if (!query) {
      return (
          // Increased padding for better vertical alignment, added min-height
          <div className="container mx-auto px-4 py-16 pt-24 min-h-[60vh]"> 
              <div className="text-center p-8 border border-dashed rounded-xl">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h1 className="text-3xl font-bold mb-4">What are you looking for?</h1>
                  <p className="text-lg text-muted-foreground">Enter a search term in the navigation bar to find deals, events, travel buddies, and partners.</p>
              </div>
          </div>
      );
  }

  if (isLoading) return (
      <div className="container mx-auto px-4 py-16 pt-24 min-h-screen text-center flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Searching for "<span className="font-semibold text-foreground">{query}</span>"...</p>
      </div>
  );
  
  if (isError) return (
      <div className="container mx-auto px-4 py-16 pt-24 min-h-screen text-center text-red-500">
          <p className="text-xl font-medium">An error occurred while fetching search results.</p>
          <p className="text-muted-foreground">Please try your search again later.</p>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 pt-24 min-h-screen">
      {/* Enhanced Header with Icon */}
      <div className="flex items-center gap-3 mb-8 border-b pb-4 border-border">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Results for: <span className="text-primary font-extrabold">"{query}"</span></h1>
      </div>
      
      {results && results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map(item => (
            <Card key={`${item.type}-${item.id}`} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="space-y-3">
                {/* Improved Badge Style and Text Formatting */}
                <Badge variant="secondary" className="w-fit text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                    {/* Converts 'featured_partner' to 'FEATURED PARTNER' */}
                    {item.type.replace(/_/g, ' ')}
                </Badge>
                <CardTitle className="text-xl line-clamp-2">
                    <Link to={item.link} className="hover:text-primary transition-colors font-bold">
                        {item.title}
                    </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground line-clamp-3 text-sm">{item.description}</p>
                {/* Improved Link with Arrow Icon */}
                <Link to={item.link} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors inline-block text-sm font-medium">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center border-dashed border-2">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
             <p className="text-xl font-semibold text-muted-foreground">Sorry, we couldn't find anything matching "{query}".</p>
             <p className="text-sm text-gray-500 mt-2">Try a different or broader search term.</p>
        </Card>
      )}
    </div>
  );
}
