import React, { useState, useEffect } from 'react';
import { Loader2, Search, ArrowRight } from "lucide-react"; 

// --- MOCKS FOR EXTERNAL DEPENDENCIES ---
// 1. Mock for react-router-dom (useSearchParams and Link)
// The state variable 'q' will simulate the search query parameter.
const useSearchParamsMock = () => {
    // In a real app, this would get 'q' from the URL. Here we use a simple state.
    const [query, setQuery] = useState('');

    // Simulate getting the query parameter 'q'
    const get = (param: string) => {
        if (param === 'q') return query;
        return null;
    };

    // Expose a way to set the query for testing/demo purposes
    const setSearchParams = (newParams: URLSearchParams) => {
        const newQuery = newParams.get('q') || '';
        setQuery(newQuery);
    };

    // To allow the user to easily test, we'll expose a setter function on the window object
    // Note: The actual `get` and `setSearchParams` follow the router API structure
    useEffect(() => {
        // You can now run 'window.setSearchQuery("new query")' in the console to test results
        (window as any).setSearchQuery = (q: string) => setQuery(q);
    }, []);
    
    // Return value matches useSearchParams: [URLSearchParams, Function]
    // Since we only need the 'get' method, we mock a minimal interface for URLSearchParams
    return [{ get, toString: () => `q=${query}` }, setSearchParams] as const; 
};

// Mock for Link component (renders a standard anchor tag)
const LinkMock: React.FC<any> = ({ to, children, className, ...props }) => (
    <a href={to} className={className} {...props}>
        {children}
    </a>
);


// 2. Mock for Custom UI Components (Card, Badge, Button)
// Defining them locally ensures no external imports are needed.

// Component: Card (defined locally)
const Card: React.FC<any> = ({ children, className }) => <div className={`rounded-xl border bg-white text-gray-900 shadow-lg ${className}`}>{children}</div>;
const CardHeader: React.FC<any> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle: React.FC<any> = ({ children, className }) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent: React.FC<any> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// Component: Badge (defined locally)
const Badge: React.FC<any> = ({ children, className, variant }) => {
    let style = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors`;
    let colorStyle = `bg-gray-200 text-gray-800 hover:bg-gray-300`; // Default style
    
    if (variant === 'secondary') {
        colorStyle = `bg-primary/10 text-primary hover:bg-primary/20`; // Primary color accent
    } else if (variant === 'outline') {
        colorStyle = `border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
    }
    
    return <span className={`${style} ${colorStyle} ${className}`}>{children}</span>;
};

// -----------------------------------------------------------------------------
// MOCK useGlobalSearch HOOK (as provided in the user's turn)
// -----------------------------------------------------------------------------
// Mock interface for the data structure the hook is expected to return
interface SearchResult { 
    id: string; 
    type: 'deal' | 'event' | 'travel_buddy' | 'featured_partner' | string; 
    title: string; 
    description: string; 
    link: string; 
}

// Mock implementation of useGlobalSearch
const useGlobalSearch = (query: string) => {
    const [data, setData] = useState<SearchResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!query) {
            setData([]);
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setData(null);

        // Simulate a network delay and results based on the query
        const timer = setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            let mockResults: SearchResult[] = [];

            if (lowerQuery.includes("cape")) {
                mockResults = [
                    { id: '1', type: 'deal', title: '5-Day Cape Town Safari Package', description: 'Experience the Big Five and Table Mountain views.', link: '/deals/1' },
                    { id: '2', type: 'event', title: 'Cape Winelands Cycling Tour', description: 'A scenic ride through Stellenbosch vineyards.', link: '/events/2' },
                    { id: '3', type: 'travel_buddy', title: 'Looking for partner in Cape Town', description: 'Hiking Table Mountain next month.', link: '/buddies/3' },
                    { id: '5', type: 'featured_partner', title: 'Cape Hotel Group Discount', description: 'Save 20% on all Cape Town hotel bookings.', link: '/partners/5' },
                ];
            } else if (lowerQuery.includes("party")) {
                 mockResults = [
                    { id: '4', type: 'event', title: 'Full Moon Beach Party', description: 'Dance the night away on a tropical beach.', link: '/events/4' },
                ];
            } else if (lowerQuery.includes("discount")) {
                 mockResults = [
                    { id: '6', type: 'deal', title: 'Last Minute Flight Discount', description: 'Up to 50% off flights departing this week.', link: '/deals/6' },
                    { id: '7', type: 'featured_partner', title: 'Gear Rental Partner Discount', description: '15% off all hiking and camping gear rental.', link: '/partners/7' },
                ];
            } else {
                // No results found
                mockResults = [];
            }
            setData(mockResults);
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [query]);

    return { data, isLoading, isError };
};
// ----------------------------


interface SearchResultsProps {
  userId: string;
}

export default function SearchResults({ userId }: SearchResultsProps) {
    // Replace original hook with the mock
    const [searchParams] = useSearchParamsMock(); 
    // Use the mock function
    const query = searchParams.get('q') || ''; 

    const { data: results, isLoading, isError } = useGlobalSearch(query);
    
    // Aesthetic Styling Configuration
    const baseClasses = `container mx-auto px-4 py-8`;

    if (!query) {
        return (
            <div className={`${baseClasses} pt-24 min-h-[60vh]`}>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>{`
                    /* Custom Tailwind Configuration for primary color */
                    .bg-primary { background-color: #197DD7; }
                    .text-primary { color: #197DD7; }
                    .hover\\:text-primary:hover { color: #197DD7; }
                `}</style>
                <div className="text-center p-8 border border-dashed rounded-xl bg-white shadow-lg">
                    <Search className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-4">What are you looking for?</h1>
                    <p className="text-lg text-gray-500">Enter a search term in the navigation bar or run <code className='bg-gray-100 p-1 rounded font-mono'>window.setSearchQuery("Cape")</code> in the console to see results.</p>
                </div>
            </div>
        );
    }

    if (isLoading) return (
        <div className={`${baseClasses} pt-24 min-h-screen text-center flex flex-col items-center justify-start`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg text-gray-600">Searching for "<span className="font-semibold text-gray-900">{query}</span>"...</p>
        </div>
    );
    
    if (isError) return (
        <div className={`${baseClasses} pt-24 min-h-screen text-center text-red-600`}>
            <h2 className="text-2xl font-bold mb-4">Search Error</h2>
            <p className="text-lg text-red-500">An error occurred while fetching search results.</p>
            <p className="text-gray-500">Please try your search again later.</p>
        </div>
    );

    return (
        <div className={`${baseClasses} pt-24 min-h-screen`}>
             <script src="https://cdn.tailwindcss.com"></script>
            <style>{`
                /* Custom Tailwind Configuration for primary color */
                .bg-primary { background-color: #197DD7; }
                .text-primary { color: #197DD7; }
                .hover\\:text-primary:hover { color: #197DD7; }
            `}</style>
            
            {/* Enhanced Header with Icon */}
            <div className="flex items-center gap-3 mb-8 border-b pb-4 border-gray-200">
                <Search className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900">
                    Results for: 
                    <span className="text-primary font-extrabold ml-2">"{query}"</span>
                </h1>
            </div>
            
            {results && results.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {results.map(item => (
                        <Card 
                            key={`${item.type}-${item.id}`} 
                            className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
                        >
                            <CardHeader className="space-y-3">
                                {/* Improved Badge Style and Text Formatting */}
                                <Badge variant="secondary" className="w-fit text-xs font-semibold uppercase tracking-wider">
                                    {/* Converts 'featured_partner' to 'FEATURED PARTNER' */}
                                    {item.type.replace(/_/g, ' ')}
                                </Badge>
                                <CardTitle className="text-xl line-clamp-2">
                                    {/* Use mock Link */}
                                    <LinkMock to={item.link} className="hover:text-primary transition-colors font-bold">
                                        {item.title}
                                    </LinkMock>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <p className="text-gray-500 line-clamp-3 text-sm">{item.description}</p>
                                {/* Improved Link with Arrow Icon */}
                                <LinkMock to={item.link} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors inline-block text-sm font-medium">
                                    View Details
                                    <ArrowRight className="h-4 w-4" />
                                </LinkMock>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-10 text-center border-dashed border-2 bg-white shadow-lg">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-gray-600">Sorry, we couldn't find anything matching "{query}".</p>
                    <p className="text-sm text-gray-500 mt-2">Try a different or broader search term.</p>
                </Card>
            )}
        </div>
    );
}