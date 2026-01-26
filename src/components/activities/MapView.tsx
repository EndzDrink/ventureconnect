import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Type-casting to bypass React 18/19 mismatch shown in your screenshot
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;
const PopupAny = Popup as any;

interface MapViewProps {
  activities: any[];
}

const getCoords = (location: string): [number, number] => {
  const loc = (location || "").toLowerCase();
  if (loc.includes('durban')) return [-29.8587, 31.0218];
  if (loc.includes('cape town')) return [-33.9249, 18.4241];
  if (loc.includes('jhb') || loc.includes('gauteng') || loc.includes('joburg') || loc.includes('johannesburg')) return [-26.2041, 28.0473];
  if (loc.includes('lesotho')) return [-29.6100, 28.2336];
  if (loc.includes('mpumalanga')) return [-25.5653, 30.5279];
  if (loc.includes('pretoria')) return [-25.7479, 28.2293];
  return [-28.4793, 24.6727]; 
};

export const MapView = ({ activities }: MapViewProps) => {
  return (
    <Card className="h-[500px] w-full overflow-hidden rounded-2xl border-2 border-muted shadow-inner relative z-0">
      <MapContainerAny 
        center={[-28.4793, 24.6727]} 
        zoom={5} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayerAny
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {activities.map((activity: any) => {
          const position = (activity.lat && activity.lng) 
            ? [Number(activity.lat), Number(activity.lng)] as [number, number]
            : getCoords(activity.location);

          return (
            <MarkerAny key={activity.id} position={position}>
              <PopupAny>
                <div className="p-1 min-w-[150px]">
                  <h4 className="font-bold text-primary text-sm mb-1">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{activity.location}</p>
                </div>
              </PopupAny>
            </MarkerAny>
          );
        })}
      </MapContainerAny>
    </Card>
  );
};