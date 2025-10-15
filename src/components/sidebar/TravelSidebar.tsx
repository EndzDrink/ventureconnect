import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Trophy, Star } from "lucide-react";
import { SidebarFooter } from "./SidebarFooter";

const upcomingTrips = [
  { destination: "Lesotho", dates: "June 15-22", companions: 3 },
  { destination: "Mpumalanga", dates: "December 10-20", companions: 2 },
];

const travelBuddies = [
  { name: "Sarah M.", location: "Cape Town", rating: 4.9, trips: 12 },
  { name: "Alex K.", location: "Western Cape", rating: 4.8, trips: 8 },
  { name: "Maya P.", location: "Northen Cape", rating: 5.0, trips: 15 },
];

const achievements = [
  { title: "Explorer", description: "Visited 8 provinces", icon: Trophy },
  { title: "Social Butterfly", description: "Made 50 connections", icon: Users },
  { title: "Adventure Guide", description: "Led 5 hikking activities", icon: Star },
];

export const TravelSidebar = () => {
  return (
    <div className="flex flex-col h-full border-l bg-card/30">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Upcoming Trips */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Upcoming Adventures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTrips.map((trip, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-semibold text-card-foreground">{trip.destination}</p>
                  <p className="text-sm text-muted-foreground">{trip.dates}</p>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{trip.companions}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Travel Buddies */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Travel Buddies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {travelBuddies.map((buddy, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>{buddy.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground truncate">{buddy.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{buddy.location}</span>
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span>{buddy.rating}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{buddy.trips} trips</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold text-card-foreground">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      
      {/* Footer - Fixed at bottom */}
      <div className="border-t bg-background/80">
        <SidebarFooter />
      </div>
    </div>
  );
};