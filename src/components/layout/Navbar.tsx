import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Compass, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  MessageCircle, // The Icon we are focusing on
  Search, 
  Home,
  Tag,
  Calendar, 
  Users, 
  Star,
  HelpCircle 
} from "lucide-react";
// Changed aliased imports to relative imports (assuming components are in the same relative path structure)
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ProfileDialog } from "../profile/ProfileDialog";
import { SettingsDialog } from "../settings/SettingsDialog";
// The useAuth hook needs to be correctly imported based on its actual location
// Assuming 'hooks' folder is one level up from 'components/layout'
import { useAuth } from "../../hooks/useAuth"; 
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  // Search handler function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to the search results page with the query parameter
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Clear the input after searching
    }
  };

  // Mobile search state and handler
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const handleMobileSearchSubmit = (e: React.FormEvent) => {
      handleSearch(e);
      setIsMobileSearchOpen(false); // Close mobile search after submission
  };


  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Compass className="h-8 w-8 text-primary" />
              <Link to="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VentureConnect
              </Link>
            </div>

          <div className="flex items-center gap-2 md:gap-6 flex-2 justify-end">
            {/* Search Area - Responsive */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-4 flex-1 max-w-xs md:max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setIsMobileSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            {/* ... rest of navigation items ... */}
            <div className="hidden xl:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-2 text-sm" onClick={handleHomeClick}>
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/deals">
                  <Tag className="h-4 w-4" />
                  <span>Deals</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/events">
                  <Calendar className="h-4 w-4" />
                  <span>Events</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/travel-buddies">
                  <Users className="h-4 w-4" />
                  <span>Travel Buddies</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/featured-partners">
                  <Star className="h-4 w-4" />
                  <span>Featured Partners</span>
                </Link>
              </Button>
            </div>
            
            {/* ===== START OF USER/AUTH CHANGES ===== */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {user ? (
                // --- Logged-in user view ---
                <>
                  {/* Notification Bell (Remains non-functional) */}
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Bell className="h-5 w-5" />
                  </Button>
                  
                  {/* Message Button: UPDATED to navigate to /messages */}
                  <Button variant="ghost" size="icon" className="hidden md:flex relative" asChild>
                    <Link to="/messages"> {/* Link to the messages route */}
                      <MessageCircle className="h-5 w-5" />
                      {/* Cosmetic Notification Badge (In a real app, this would be conditional) */}
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-background"></span>
                    </Link>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || ""} />
                          <AvatarFallback>
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                // --- Logged-out user view ---
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
            {/* ===== END OF USER/AUTH CHANGES ===== */}
          </div>
        </div>
      </nav>

      {/* NEW: Full-screen Mobile Search Overlay */}
      {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-4 sm:hidden">
              <div className="flex items-center justify-between h-16">
                  <form onSubmit={handleMobileSearchSubmit} className="flex-1 relative mr-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search..."
                          className="pl-10 pr-4 py-2 w-full text-base"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                      />
                  </form>
                  <Button 
                      variant="ghost" 
                      onClick={() => {
                          setIsMobileSearchOpen(false);
                          setSearchTerm(''); // Clear term when closing
                      }}
                  >
                      Cancel
                  </Button>
              </div>
              {/* Optional: Add search suggestions/history here */}
          </div>
      )}

      {/* Dialogs controlled by Navbar state */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Bottom Navigation - Visible on small screens only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-t border-border/40 z-50 xl:hidden">
        <div className="flex items-center justify-around py-2 px-4">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" onClick={handleHomeClick}>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/deals">
              <Tag className="h-5 w-5" />
              <span>Deals</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/events">
              <Calendar className="h-5 w-5" />
              <span>Events</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/travel-buddies">
              <Users className="h-5 w-5" />
              <span>Buddies</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/featured-partners">
              <Star className="h-5 w-5" />
              <span>Partners</span>
            </Link>
          </Button>
        </div>
      </nav>
    </>
  );
};
export default Navbar;