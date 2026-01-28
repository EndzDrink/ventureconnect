import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Compass, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  MessageCircle, 
  Search, 
  Home,
  Tag,
  PartyPopper, 
  Users, 
  Star,
  HelpCircle,
  Camera // Added for Memories
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ProfileDialog } from "../profile/ProfileDialog";
import { SettingsDialog } from "../settings/SettingsDialog";
import { useAuth } from "../../hooks/useAuth"; 
import { useConversations } from "../../hooks/useConversations"; 
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
  const { conversations } = useConversations(); 
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); 
    }
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const handleMobileSearchSubmit = (e: React.FormEvent) => {
      handleSearch(e);
      setIsMobileSearchOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Compass className="h-8 w-8 text-primary" />
              <Link to="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VentureConnect
              </Link>
            </div>

          <div className="flex items-center gap-2 md:gap-6 flex-2 justify-end">
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

            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setIsMobileSearchOpen(true)}>
              <Search className="h-5 w-5 text-primary" />
            </Button>

            <div className="hidden xl:flex items-center gap-1 text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              <Button variant="ghost" size="sm" className="gap-2 text-sm" onClick={handleHomeClick}>
                <Home className="h-4 w-4 text-primary" />
                <span>Home</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/deals">
                  <Tag className="h-4 w-4 text-primary" />
                  <span>Deals</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/events">
                  <PartyPopper className="h-4 w-4 text-primary" />
                  <span>Events</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/memories">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Memories</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/travel-buddies">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Travel Buddies</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <Link to="/featured-partners">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Featured Partners</span>
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {user ? (
                <>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Bell className="h-5 w-5" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" className="hidden md:flex relative" asChild>
                    <Link to="/messages">
                      <MessageCircle className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-background animate-in zoom-in duration-300">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
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

                      {/* Memories in Dropdown */}
                      <DropdownMenuItem onClick={() => navigate("/memories")}>
                        <Camera className="mr-2 h-4 w-4" />
                        <span>Community Memories</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/my-adventures")}>
                        <Compass className="mr-2 h-4 w-4" />
                        <span>My Adventures</span>
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
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
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
                          setSearchTerm(''); 
                      }}
                  >
                      Cancel
                  </Button>
              </div>
          </div>
      )}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-t border-border/40 z-50 xl:hidden">
        <div className="flex items-center justify-around py-2 px-4">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" onClick={handleHomeClick}>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/events">
              <PartyPopper className="h-5 w-5" />
              <span>Events</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/memories">
              <Camera className="h-5 w-5" />
              <span>Memories</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs" asChild>
            <Link to="/travel-buddies">
              <Users className="h-5 w-5" />
              <span>Buddies</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 p-2 h-auto min-h-[60px] text-xs relative" asChild>
            <Link to="/messages">
              <MessageCircle className="h-5 w-5" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white border border-white">
                  {unreadCount > 9 ? '!' : unreadCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </nav>
    </>
  );
};
export default Navbar;