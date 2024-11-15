import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import React from "react";

interface Marker2DProps {
  position: google.maps.LatLngLiteral | null;
  type: "origin" | "destination" | "waypoint";
  color: string;
}

const Marker2D: React.FC<Marker2DProps> = ({ position, color }) => {
  if (!position) return null;

  return (
    <AdvancedMarker position={position}>
      <div className="relative">
        <div className={`${color} fill-current`}>
          <MapPin
            className="w-10 h-10"
            fill="currentColor"
            stroke="#f6f7f6"
            strokeWidth={1.5}
          >
            {/* Add white dot in the center */}
            <circle cx="12" cy="10" r="2" fill="white" />
          </MapPin>
        </div>
      </div>
    </AdvancedMarker>
  );
};

export { Marker2D };
