import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, MapPin, Clock } from "lucide-react";

const sponsors = [
  {
    id: 1,
    name: "Point Waterfront Apartments",
    description: "Luxury accommodations worldwide with exclusive member discounts",
    discount: "25% OFF",
    rating: 4.8,
    image: "🏨",
    link: "#",
    location: "Durban"
  },
  {
    id: 2,
    name: "Urban Natural",
    description: "Premium outdoor equipment for your next expedition",
    discount: "15% OFF",
    rating: 4.9,
    image: "🎒",
    link: "#",
    location: "Gauteng"
  },
  {
    id: 3,
    name: "Cheapflights",
    description: "Best flight prices guaranteed for adventure seekers",
    discount: "Up to 40% OFF",
    rating: 4.7,
    image: "✈️",
    link: "#",
    location: "JHB-CPT"
  }
];

const featuredAds = [
  {
    id: 1,
    title: "Bali Paradise Retreat",
    description: "7-day spiritual journey in tropical paradise",
    price: "R11 899",
    originalPrice: "ZAR 21,299",
    image: "🏝️",
    urgent: true
  },
  {
    id: 2,
    title: "Swiss Alps Adventure",
    description: "Mountain hiking and scenic railway tours",
    price: "R41,599",
    originalPrice: "ZAR22,199",
    image: "🏔️",
    urgent: false
  }
];

export const SponsorsSidebar = () => {
  return (
    <div className="h-full overflow-y-auto space-y-4 p-4">
      {/* Sponsored Partners */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Featured Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sponsor.image}</span>
                  <div>
                    <h4 className="font-semibold text-sm">{sponsor.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {sponsor.location}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {sponsor.discount}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {sponsor.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs font-medium">{sponsor.rating}</span>
                </div>
                <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Featured Deals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Limited Deals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredAds.map((ad) => (
            <div key={ad.id} className="relative p-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all cursor-pointer">
              {ad.urgent && (
                <Badge className="absolute -top-1 -right-1 text-xs animate-pulse">
                  Hot Deal!
                </Badge>
              )}
              
              <div className="flex items-start gap-3">
                <span className="text-3xl">{ad.image}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{ad.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {ad.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{ad.price}</span>
                    <span className="text-xs text-muted-foreground line-through">
                      {ad.originalPrice}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-3 h-7 text-xs">
                Book Now
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ad Space */}
      <Card className="bg-gradient-to-br from-accent/20 to-accent/5">
        <CardContent className="p-4 text-center">
          <div className="text-4xl mb-2">🌍</div>
          <h4 className="font-semibold text-sm mb-1">Advertise Here</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Reach thousands of adventure seekers
          </p>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};