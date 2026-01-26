import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "@/components/ui/sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 

import { AuthProvider, useAuth } from "@/hooks/useAuth"; 
import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated"; 

import Index from "@/pages/Index";
import Deals from "@/pages/Deals";
import Events from "@/pages/Events";
import TravelBuddies from "@/pages/TravelBuddies";
import FeaturedPartners from "@/pages/FeaturedPartners";
import MyAdventures from "@/pages/MyAdventures";
import Memories from "@/pages/Memories"; // New Import for Community Feed
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SearchResults from "@/pages/SearchResults"; 
import Messages from "./pages/Messages";
import Settings from "@/components/settings/SettingsDialog";

import NavBar from "@/components/layout/Navbar"; 

const queryClient = new QueryClient();

// --- Types ---

interface PageProps {
  userId: string;
}

interface ProtectedRouteProps {
  element: React.ReactElement<PageProps>; 
  userId?: string; 
}

interface NavLayoutProps {
  children: React.ReactNode;
}

// --- Protected Route Component ---

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const { user, loading } = useAuth() as any; 
  
  const isAuthenticated = !!user;
  const isAuthReady = !loading;
  const userId = user?.id || "";

  const location = useLocation();
  
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthReady) {
        setLoadingTimeout(true);
      }
    }, 5000);

    if (isAuthReady) {
      clearTimeout(timer);
      setLoadingTimeout(false);
    }

    return () => clearTimeout(timer);
  }, [isAuthReady]);

  if (!isAuthReady) {
    if (loadingTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p- text-center text-red-600">
                <h2 className="text-2xl font-bold mb-4">Authentication Initialization Error</h2>
                <p className="text-lg">The authentication service failed to initialize within 5 seconds.</p>
            </div>
        );
    }
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return React.cloneElement(element, { userId } as PageProps);
};

// --- Nav Layout Component ---

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

const IndexPage: React.FC<PageProps> = (props) => <Index {...props} />;
const MessagesPage: React.FC<PageProps> = (props) => <Messages />;
const DealsPage: React.FC<PageProps> = (props) => <Deals {...props} />;
const EventsPage: React.FC<PageProps> = (props) => <Events {...props} />;
const TravelBuddiesPage: React.FC<PageProps> = (props) => <TravelBuddies {...props} />;
const FeaturedPartnersPage: React.FC<PageProps> = (props) => <FeaturedPartners {...props} />;
const MyAdventuresPage: React.FC<PageProps> = (props) => <MyAdventures />;
const MemoriesPage: React.FC<PageProps> = (props) => <Memories />; // Memories Wrapper
const SearchResultsPage: React.FC<PageProps> = (props) => <SearchResults {...props} />;


interface SettingsPageProps extends PageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const SettingsPage: React.FC<SettingsPageProps> = (props) => <Settings {...props} />;


// --- Main App Component ---

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dummyOnOpenChange = (open: boolean) => {
    setIsSettingsOpen(open);
  };

  return (
    <QueryClientProvider client={queryClient}> 
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<NavLayout><ProtectedRoute element={<IndexPage userId={""} />} /></NavLayout>} />
              <Route path="/deals" element={<NavLayout><ProtectedRoute element={<DealsPage userId={""} />} /></NavLayout>} />
              <Route path="/events" element={<NavLayout><ProtectedRoute element={<EventsPage userId={""} />} /></NavLayout>} />
              <Route path="/travel-buddies" element={<NavLayout><ProtectedRoute element={<TravelBuddiesPage userId={""} />} /></NavLayout>} />
              <Route path="/messages" element={<NavLayout><ProtectedRoute element={<MessagesPage userId={""} />} /></NavLayout>} />
              
              <Route path="/my-adventures" element={<NavLayout><ProtectedRoute element={<MyAdventuresPage userId={""} />} /></NavLayout>} />
              
              {/* Memories Route */}
              <Route path="/memories" element={<NavLayout><ProtectedRoute element={<MemoriesPage userId={""} />} /></NavLayout>} />
              
              <Route path="/featured-partners" element={<NavLayout><ProtectedRoute element={<FeaturedPartnersPage userId={""} />} /></NavLayout>} />
              
              <Route path="/settings" 
                element={<NavLayout>
                  <ProtectedRoute element={<SettingsPage userId={""} open={isSettingsOpen} onOpenChange={dummyOnOpenChange} />} />
                </NavLayout>} 
              />
              
              <Route path="/search" element={<NavLayout><ProtectedRoute element={<SearchResultsPage userId={""} />} /></NavLayout>} />
              
              <Route path="/login" element={<RedirectIfAuthenticated element={<Login />} />} />
              <Route path="/signup" element={<RedirectIfAuthenticated element={<Signup />} />} />

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