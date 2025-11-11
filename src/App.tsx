import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from 'react';
// Import QueryClient and QueryClientProvider to fix "No QueryClient set" error
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

// Using absolute paths for all internal imports to resolve compilation errors
import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "@/components/ui/sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 

// Authentication and Context
import { AuthProvider, useAuth } from "@/hooks/useAuth"; 
import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated"; 

// Page Imports
import Index from "@/pages/Index";
import Deals from "@/pages/Deals";
import Events from "@/pages/Events";
import TravelBuddies from "@/pages/TravelBuddies";
import FeaturedPartners from "@/pages/FeaturedPartners";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SearchResults from "@/pages/SearchResults"; 
import Messages from "./pages/Messages";
// Note: This import should resolve the "Settings is not defined" error if it was a scoping issue here.
import Settings from "@/components/settings/SettingsDialog";

import NavBar from "@/components/layout/Navbar"; 

// Initialize Query Client once outside the component
const queryClient = new QueryClient();

// --- Types ---

// Define a base interface for all pages that require the authenticated userId
interface PageProps {
  userId: string;
}

interface ProtectedRouteProps {
  element: React.ReactElement<PageProps>; // Specify that the element must accept PageProps
  userId?: string; 
}

interface NavLayoutProps {
  children: React.ReactNode;
}

// --- Protected Route Component ---

/**
 * A wrapper component that checks for authentication status.
 * If authenticated, it renders the protected element.
 * If not authenticated, it redirects to the login page.
 * It also injects the current userId into the protected element.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  // Destructure user and loading from the Supabase useAuth hook
  // Assuming useAuth returns { user: User | null, loading: boolean }
  const { user, loading } = useAuth() as any; 
  
  // Map Supabase-style state to the expected state
  const isAuthenticated = !!user;
  const isAuthReady = !loading;
  const userId = user?.id || "";

  const location = useLocation();
  
  // State to track if loading has taken too long
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Set a 5-second timeout for authentication to be ready
    const timer = setTimeout(() => {
      if (!isAuthReady) {
        setLoadingTimeout(true);
      }
    }, 5000);

    // Clear the timeout if authentication becomes ready
    if (isAuthReady) {
      clearTimeout(timer);
      setLoadingTimeout(false);
    }

    return () => clearTimeout(timer);
  }, [isAuthReady]);

  if (!isAuthReady) {
    if (loadingTimeout) {
        // Show an explicit error after 5 seconds
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p- text-center text-red-600">
                <h2 className="text-2xl font-bold mb-4">Authentication Initialization Error</h2>
                <p className="text-lg">The authentication service failed to initialize within 5 seconds. Please check your network connection or the Firebase configuration.</p>
            </div>
        );
    }
    // Render a loading spinner while auth status is determined
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login, storing the current path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Inject the userId prop into the protected element dynamically.
  // The element is now typed to accept PageProps, which includes userId.
  return React.cloneElement(element, { userId } as PageProps);
};

// --- Nav Layout Component ---

/**
 * Wraps pages that should include the NavBar.
 */
const NavLayout: React.FC<NavLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-grow pt-16">
        {children}
      </main>
    </div>
  );
};


// --- Helper Components for Typing ---
// Explicitly typing helper components as React.FC<Props> to resolve the
// 'IntrinsicAttributes' error and correctly associate the 'userId' prop.

const IndexPage: React.FC<PageProps> = (props) => <Index {...props} />;
const MessagesPage: React.FC<PageProps> = (props) => <Messages {...props} />;
const DealsPage: React.FC<PageProps> = (props) => <Deals {...props} />;
const EventsPage: React.FC<PageProps> = (props) => <Events {...props} />;
const TravelBuddiesPage: React.FC<PageProps> = (props) => <TravelBuddies {...props} />;
const FeaturedPartnersPage: React.FC<PageProps> = (props) => <FeaturedPartners {...props} />;
const SearchResultsPage: React.FC<PageProps> = (props) => <SearchResults {...props} />;

// Settings page requires both PageProps and the specific Dialog props
interface SettingsPageProps extends PageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const SettingsPage: React.FC<SettingsPageProps> = (props) => <Settings {...props} />;


// --- Main App Component ---

const App: React.FC = () => {
  // Define dummy state and handler for the Settings Dialog props.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dummyOnOpenChange = (open: boolean) => {
    setIsSettingsOpen(open);
  };

  return (
    // Wrap the entire application in QueryClientProvider
    <QueryClientProvider client={queryClient}> 
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Pages requiring authentication and navigation */}
              {/* Use the new type-safe wrapper components (IndexPage, DealsPage, etc.) */}
              <Route path="/" element={<NavLayout><ProtectedRoute element={<IndexPage userId={""} />} /></NavLayout>} />
              <Route path="/deals" element={<NavLayout><ProtectedRoute element={<DealsPage userId={""} />} /></NavLayout>} />
              <Route path="/events" element={<NavLayout><ProtectedRoute element={<EventsPage userId={""} />} /></NavLayout>} />
              <Route path="/travel-buddies" element={<NavLayout><ProtectedRoute element={<TravelBuddiesPage userId={""} />} /></NavLayout>} />
              <Route path="/messages" element={<NavLayout><ProtectedRoute element={<MessagesPage userId={""} />} /></NavLayout>} />
              
              {/* Changed path from /partners to /featured-partners to resolve 404 */}
              <Route path="/featured-partners" element={<NavLayout><ProtectedRoute element={<FeaturedPartnersPage userId={""} />} /></NavLayout>} />
              
              {/* Settings route using SettingsPage wrapper */}
              <Route path="/settings" 
                element={<NavLayout>
                  <ProtectedRoute element={<SettingsPage userId={""} open={isSettingsOpen} onOpenChange={dummyOnOpenChange} />} />
                </NavLayout>} 
              />
              
              {/* Changed path from /search-results to /search */}
              <Route path="/search" element={<NavLayout><ProtectedRoute element={<SearchResultsPage userId={""} />} /></NavLayout>} />
              
              {/* Auth pages, redirect if already authenticated */}
              <Route path="/login" element={<RedirectIfAuthenticated element={<Login />} />} />
              <Route path="/signup" element={<RedirectIfAuthenticated element={<Signup />} />} />

              {/* 404 Not Found Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
