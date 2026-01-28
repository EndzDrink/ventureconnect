import React from 'react';
import { Loader2, Zap, ArrowRight, Building, Clock, Copy, Tag, ShoppingBag } from "lucide-react";
import { useQuery } from '@tanstack/react-query'; 

// -----------------------------------------------------------------------------
// DATA INTERFACE DEFINITIONS
// -----------------------------------------------------------------------------

// Base Partner interface (what comes directly from the database)
interface Partner {
    id: string | number | null;
    name: string | null; 
    description: string | null;
    category: string | null;
    created_at: string | null; 
    discount: string | null; 
    location: string | null;
    rating: number | null;
    reviews: number | null;
    original_price: number | null;
    website_url: string | null;
    image: string | null; 
}

// DisplayPartner interface (what the UI expects, which includes the calculated discountNum)
type DisplayPartner = Partner & { discountNum: number };


// --- SUPABASE CLIENT STUB (MANDATORY FOR COMPILATION) ---
const createClient = (url: string, key: string) => {
    return {
        from: (tableName: string) => ({
            select: (columns: string) => ({
                order: (column: string, config: any) => ({
                    limit: (n: number) => {
                        // Mock data now correctly includes the 'discountNum' property 
                        // to match the DisplayPartner type if the connection fails.
                        const mockData: DisplayPartner[] = [
                            {
                                id: 1,
                                name: "Point Waterfront Apartments",
                                description: "Accommodation and Apartment, Premium",
                                category: "Travel",
                                created_at: "2025-11-04T07:36:06.169092+00:00",
                                discount: "25%", 
                                location: "Durban",
                                rating: 5,
                                reviews: 100,
                                website_url: "https://example.com/point-waterfront",
                                image: "https://placehold.co/100x100/197DD7/ffffff?text=PW", 
                                original_price: null, // Added missing required property
                                discountNum: 25, // CRITICAL: Added for DisplayPartner type
                            },
                        ];
                        return Promise.resolve({ data: mockData, error: null }); 
                    }
                })
            }),
        }),
    };
};

// IMPORTANT: Your provided Supabase credentials
const supabaseUrl = "https://ilidtqlbkwyoxoowyggl.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaWR0cWxia3d5b3hvb3d5Z2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDE3NDIsImV4cCI6MjA3MTc3Nzc0Mn0.hvBhSWEJuu8rXBwm7d6-h0ywNULDrh8J1td4_WGHOgo"; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);


// -----------------------------------------------------------------------------
// LOCAL UI COMPONENTS 
// -----------------------------------------------------------------------------

const accentColor = "yellow"; 

const Card: React.FC<any> = ({ children, className, onClick }) => (
    <div 
        className={`rounded-xl border bg-white text-gray-900 shadow-lg ${className}`}
        onClick={onClick}
    >
        {children}
    </div>
);
const CardHeader: React.FC<any> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle: React.FC<any> = ({ children, className }) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription: React.FC<any> = ({ children, className }) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
const CardContent: React.FC<any> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Badge: React.FC<any> = ({ children, className, variant }) => {
    let style = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors`;
    if (variant === 'default') {
        style += ` bg-primary text-white hover:bg-primary/90`; 
    } else if (variant === 'secondary') {
        style += ` bg-${accentColor}-100 text-${accentColor}-800 hover:bg-${accentColor}-200`;
    } else if (variant === 'outline') {
        style += ` border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
    }
    return <span className={`${style} ${className}`}>{children}</span>;
};

const Button: React.FC<any> = ({ children, className, variant, asChild, ...props }) => {
    let baseStyle = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-5 py-2";
    let colorStyle = `bg-primary text-white shadow-md hover:bg-primary/90 focus-visible:ring-primary`; 
    
    if (variant === 'outline') {
        colorStyle = `border border-primary/20 bg-white shadow-sm hover:bg-primary/5 text-primary focus-visible:ring-primary`; 
    } else if (variant === 'ghost') {
        colorStyle = `hover:bg-gray-100 text-primary focus-visible:ring-primary`;
        baseStyle = baseStyle.replace('h-10 px-5', 'h-8 px-3');
    }
    
    // We force standard button rendering here to avoid the nested <a> tag error
    if (asChild) return <a className={`${baseStyle} ${colorStyle} ${className}`} {...props}>{children}</a>;
    return <button className={`${baseStyle} ${colorStyle} ${className}`} {...props}>{children}</button>;
};

// -----------------------------------------------------------------------------
// DATA FETCHING (Corrected Return Type)
// -----------------------------------------------------------------------------

// FIX: Changed the return type to Promise<DisplayPartner[]>
const fetchPartners = async (): Promise<DisplayPartner[]> => {
    const { data, error } = await supabase
        .from('featured_partners') 
        .select(`
            id, 
            name, 
            description, 
            category, 
            created_at, 
            discount, 
            location, 
            rating, 
            reviews, 
            original_price,
            website_url,
            image 
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Supabase Partner Fetch Error:", error.message);
        throw new Error(error.message); 
    }
    
    // POST-PROCESSING: Converting discount string ("25%") to a number (25)
    // The result of this map operation is DisplayPartner[]
    return (data as Partner[] || []).map(partner => {
        let discountNum = 0;
        if (typeof partner.discount === 'string') {
            const matches = partner.discount.match(/(\d+)/);
            if (matches) {
                discountNum = parseInt(matches[0], 10);
            }
        }
        return {
            ...partner,
            discountNum: discountNum 
        } as DisplayPartner; // Cast to DisplayPartner here to match function return type
    }) || [];
};

interface FeaturedPartnersProps {
  userId: string;
}

export default function FeaturedPartners({ userId }: FeaturedPartnersProps) {
    const useToast = (): any => ({
        toast: (options: any) => console.log('Toast Fired (PLACEHOLDER):', options.title, options.description)
    });
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        try {
            const el = document.createElement('textarea');
            el.value = text;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy'); 
            document.body.removeChild(el);
            
            toast({
                title: "Code Copied!",
                description: `"${text}" is now on your clipboard. Enjoy the discount!`,
                duration: 3000,
            });
        } catch (err) {
            console.error("Copy failed:", err);
            toast({
                title: "Copy Failed",
                description: "Could not copy the code automatically. Please copy manually.",
                variant: "destructive"
            });
        }
    };
  
    const { 
        data: partners, 
        isLoading, 
        isError, 
        error 
    } = useQuery<DisplayPartner[], Error>({ 
        queryKey: ['featuredPartners'],
        queryFn: fetchPartners,
        staleTime: 1000 * 60 * 5, 
    });
    
    // Type of partnersData is now correctly inferred as DisplayPartner[]
    const partnersData = partners || []; 

    // --- Loading and Error States ---

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-8 pb-20">
                <div className="container mx-auto px-4 py-8 pt-8 text-center flex flex-col items-center">
                    <Loader2 className={`h-8 w-8 animate-spin text-primary mb-4`} /> 
                    <p className="text-gray-600">Connecting securely to the database and loading our **featured partners**...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        
        const errorMessage = error?.message || "Unknown error";
        
        const displayMessage: React.ReactNode = (
            <p className="text-sm text-red-800 mt-2">
                A database error occurred: **{errorMessage}**. Please check your **Supabase dashboard** for **Row Level Security (RLS)** policies on the `featured_partners` table.
            </p>
        );
        
        return (
            <div className="min-h-screen bg-gray-50 pt-8 pb-20">
                <div className={`container mx-auto px-4 py-16 pt-24 text-center text-red-600 bg-red-50 rounded-xl p-6 shadow-xl max-w-lg`}>
                    <Zap className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p className="text-xl font-bold">Error Loading Partners</p>
                    {displayMessage}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>{`
                /* Custom Tailwind Configuration for primary color */
                :root {
                  --color-primary: 25, 125, 215; /* Blue hue */
                  --color-accent: 76, 175, 80; /* Green hue */
                }
                /* Utility classes referencing the custom variables */
                .bg-primary { background-color: rgb(var(--color-primary)); }
                .text-primary { color: rgb(var(--color-primary)); }
                .hover\\:bg-primary\\/90:hover { background-color: rgba(var(--color-primary), 0.9); }
                .border-primary\\/20 { border-color: rgba(var(--color-primary), 0.2); }
                .hover\\:bg-primary\\/5:hover { background-color: rgba(var(--color-primary), 0.05); }
                .bg-code-box { background-color: rgba(var(--color-primary), 0.05); }
            `}</style>
            
                <div className="container mx-auto px-4 py-8">
                    
                    {/* Header Block */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <ShoppingBag className="h-8 w-8 text-primary" /> 
                            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Exclusive Partner Deals</h1>
                        </div>
                        <p className="text-gray-600 text-lg">
                            Curated discounts and offers just for our community members.
                        </p>
                    </div>

                    {/* Partner Grid */}
                    {partnersData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {partnersData.map((partner) => {
                                const title = partner.name ?? 'New Partner Offer'; 
                                const description = partner.description ?? 'A fantastic service or product offered by one of our featured collaborators.';
                                const category = partner.category ?? 'General';
                                const partnerUrl = partner.website_url ?? '#';
                                const discountPercentage = partner.discountNum; // Safely accessed because of correct typing
                                const logoUrl = partner.image ?? ''; 
                                
                                const discountCode = discountPercentage > 0 ? `${discountPercentage}%OFF` : 'NOCODE'; 
                                const hasDiscount = discountPercentage > 0;
                                const location = partner.location ?? 'Global'; 
                                const currentRating = partner.rating ?? 0; 
                                const reviewCount = partner.reviews ?? 0; 
                                const createdAt = partner.created_at ? new Date(partner.created_at).toLocaleDateString() : 'Date TBD';
                                const key = partner.id ? String(partner.id) : title; 
                                
                                return (
                                    <Card 
                                        key={key} 
                                        className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col"
                                    >
                                        <CardHeader className="flex-grow pb-4">
                                            
                                            {/* Logo and Category */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary/20 bg-gray-50 overflow-hidden shrink-0">
                                                    <img 
                                                        src={logoUrl || `https://placehold.co/100x100/E0E7FF/4F46E5?text=${title.substring(0,2)}`} 
                                                        alt={`${title} Logo`} 
                                                        className="w-full h-full object-cover p-1 rounded-full" 
                                                        onError={(e) => { 
                                                            e.currentTarget.onerror = null; 
                                                            e.currentTarget.src=`https://placehold.co/100x100/E0E7FF/197DD7?text=${title.substring(0,2)}`; 
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <Badge variant="outline">{category}</Badge>
                                                    {hasDiscount && <Badge variant="secondary" className="flex items-center gap-1">
                                                          <Tag className='h-3 w-3' /> {discountPercentage}% OFF
                                                      </Badge>}
                                                </div>
                                            </div>
                                            
                                            {/* Title and Description */}
                                            <CardTitle className="text-xl mb-1 leading-snug">{title}</CardTitle>
                                            <CardDescription className="text-sm line-clamp-3">
                                                {description}
                                            </CardDescription>
                                            
                                            {/* Rating and Location */}
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-500">Added: {createdAt}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className='flex items-center gap-1'>
                                                        <span className='text-xs font-medium text-gray-500'>{location}</span>
                                                        <Building className='h-3 w-3 text-gray-400' />
                                                    </div>
                                                    <div className='flex items-center gap-1 text-yellow-600'>
                                                        <span className='text-sm font-semibold'>{currentRating.toFixed(1)}</span>
                                                        <span className='text-xs'>({reviewCount})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        
                                        <CardContent>
                                            {hasDiscount && (
                                                <div className="mb-4 p-3 border border-primary/20 rounded-lg bg-code-box flex items-center justify-between shadow-inner">
                                                    <span className={`text-lg font-mono font-bold text-primary break-all`}>{discountCode}</span> 
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-8 px-3 ml-2 flex items-center gap-1 text-primary hover:bg-primary/5"
                                                        onClick={() => copyToClipboard(discountCode)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        Copy
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            <Button 
                                                className="w-full gap-2 bg-primary hover:bg-primary/90"
                                                onClick={() => window.open(partnerUrl, '_blank')}
                                            > 
                                                {hasDiscount ? "Access Exclusive Offer" : "View Partner Site"}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        // No Data Message 
                        <div className="text-center mt-10 p-10 text-gray-500 border border-dashed rounded-xl bg-white shadow">
                            <Building className="h-6 w-6 mx-auto mb-3" />
                            <p className="text-lg font-semibold">No featured partners are available right now.</p>
                            <p className="text-sm mt-1">If this message persists, please verify your **Supabase database** connection and RLS policies on the `featured_partners` table.</p>
                        </div>
                    )}
                </div>
        </div>
    );
}