// map-3d/components/Route3D.tsx
import React, { useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Polyline3D } from "./Polyline3D";

interface RouteRequest {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  waypoints?: google.maps.LatLngLiteral[];
  travelMode?: google.maps.TravelMode;
}

interface Route3DProps {
  request: RouteRequest;
  strokeColor?: string;
  strokeWidth?: number;
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  onClick?: () => void;
}

export const Route3D: React.FC<Route3DProps> = ({
  request,
  strokeColor = "rgba(25, 102, 210, 0.75)",
  strokeWidth = 10,
  altitudeMode = "RELATIVE_TO_GROUND",
  onClick,
}) => {
  const routesLibrary = useMapsLibrary("routes");
  const [routeCoordinates, setRouteCoordinates] = useState<
    google.maps.LatLngLiteral[]
  >([]);
  const [routeService, setRouteService] =
    useState<google.maps.DirectionsService | null>(null);

  // Initialize DirectionsService
  useEffect(() => {
    if (!routesLibrary) return;
    setRouteService(new routesLibrary.DirectionsService());
  }, [routesLibrary]);

  // Calculate route when request changes
  useEffect(() => {
    if (!routeService) return;

    const calculateRoute = async () => {
      try {
        const response = await routeService.route({
          origin: request.origin,
          destination: request.destination,
          waypoints: request.waypoints?.map((waypoint) => ({
            location: waypoint,
          })),
          travelMode: request.travelMode || google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        });

        if (response.routes.length === 0) {
          throw new Error("No routes found");
        }

        // Convert route path to coordinates
        const path = response.routes[0].overview_path.map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        }));

        setRouteCoordinates(path);
      } catch (error) {
        console.error("Error calculating route:", error);

        setRouteCoordinates([]);
      }
    };

    calculateRoute();
  }, [routeService, request]);

  if (routeCoordinates.length === 0) return null;

  return (
    <Polyline3D
      coordinates={routeCoordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      altitudeMode={altitudeMode}
      onClick={onClick}
    />
  );
};
