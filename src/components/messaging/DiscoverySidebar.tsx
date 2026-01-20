import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { useTravelBuddies } from '../../hooks/useTravelBuddies';
import { useAuth } from '../../hooks/useAuth';

interface DiscoverySidebarProps {
  onSelectBuddy: (buddyId: string) => void;
}

const DiscoverySidebar: React.FC<DiscoverySidebarProps> = ({ onSelectBuddy }) => {
  const { user } = useAuth();
  const { data: buddies } = useTravelBuddies(user?.id);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBuddies = buddies?.filter(b => 
    b.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-4 border-b bg-white/50">
        <h2 className="text-xl font-bold tracking-tight">Find Buddies</h2>
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search travelers..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
        {filteredBuddies?.map((buddy) => (
          <div 
            key={buddy.user_id} 
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate text-slate-700">
                {buddy.username}
              </span>
              <span className="text-[10px] text-slate-400">Available to chat</span>
            </div>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={() => onSelectBuddy(buddy.user_id)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverySidebar;