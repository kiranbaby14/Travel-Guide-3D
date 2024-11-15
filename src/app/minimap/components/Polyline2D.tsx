import React, { useEffect, useMemo } from "react";
import { useMap } from "@vis.gl/react-google-maps";

interface MiniMapPolylineProps {
  path: google.maps.LatLng[];
}

const Polyline2D: React.FC<MiniMapPolylineProps> = ({ path }) => {
  const map = useMap("minimap");

  const polyline = useMemo(() => {
    if (!path) return null;

    return new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#4285F4",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  }, [path]);

  useEffect(() => {
    if (polyline && map) {
      polyline.setMap(map);
    }
    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [polyline, map]);

  return null;
};

export { Polyline2D };
