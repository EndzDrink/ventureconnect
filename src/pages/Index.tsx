import { Navbar } from "@/components/layout/Navbar"; // Reverted to alias
import { ActivitiesFeed } from "@/components/activities/ActivitiesFeed"; // Reverted to alias
import { TravelSidebar } from "@/components/sidebar/TravelSidebar"; // Reverted to alias
import { SponsorsSidebar } from "@/components/sidebar/SponsorsSidebar"; // Reverted to alias

// Define the expected props for Index, which now includes userId
interface IndexProps {
  userId: string;
}

// Accept the userId prop passed from ProtectedRoute
const Index = ({ userId }: IndexProps) => { 
  return (
    <div className="min-h-screen bg-background">
      {/* We assume Navbar is available globally or doesn't need userId */}
      <Navbar />
      
      <div className="pt-16 pb-20 lg:pb-0 min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="container mx-auto px-4 py-6 flex gap-6 min-h-[calc(100vh-4rem)]">
            {/* Left Sponsors Sidebar - Hidden on mobile and small tablets */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-[88px] h-[calc(100vh-88px)] flex flex-col">
                <SponsorsSidebar />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {/* IMPORTANT: Pass the userId down to ActivitiesFeed */}
              <ActivitiesFeed userId={userId} />
            </div>
            
            {/* Right Travel Sidebar - Hidden on mobile, shown on medium screens and up */}
            <div className="hidden md:block w-80 flex-shrink-0">
              <div className="sticky top-[88px] h-[calc(100vh-88px)] flex flex-col">
                <TravelSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
