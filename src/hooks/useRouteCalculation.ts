import { useCallback, useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type RouteRequest = {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  waypoints?: google.maps.LatLngLiteral[];
  travelMode?: google.maps.TravelMode;
};

type RouteData = {
  routeCoordinates: google.maps.LatLngLiteral[];
  overview_path: google.maps.LatLng[];
  bounds: google.maps.LatLngBounds;
  distance: string;
  duration: string;
};

const useRouteCalculation = () => {
  const routesLibrary = useMapsLibrary("routes");
  const [routeService, setRouteService] =
    useState<google.maps.DirectionsService | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize DirectionsService
  useEffect(() => {
    if (!routesLibrary) return;
    setRouteService(new routesLibrary.DirectionsService());
  }, [routesLibrary]);

  const calculateRoute = useCallback(
    async (request: RouteRequest) => {
      if (!routeService) return null;

      setIsCalculating(true);
      setError(null);

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

        const route = response.routes[0];
        const leg = route.legs[0];

        const data: RouteData = {
          routeCoordinates: route.overview_path.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          })),
          overview_path: route.overview_path,
          bounds: route.bounds,
          distance: leg.distance?.text || "",
          duration: leg.duration?.text || "",
        };

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to calculate route";
        setError(errorMessage);
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [routeService],
  );

  return {
    calculateRoute,
    isCalculating,
    error,
  };
};

export { useRouteCalculation };
