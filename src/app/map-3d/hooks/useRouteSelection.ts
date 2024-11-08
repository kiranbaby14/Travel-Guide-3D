import { useCallback, useState } from "react";

interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface RouteCoordinates {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  waypoints?: LatLngLiteral[];
}

interface RouteSelectionOptions {
  onRouteSelect?: (route: RouteCoordinates) => void;
  defaultRoute?: RouteCoordinates;
}

export const useRouteSelection = (options: RouteSelectionOptions = {}) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteCoordinates | null>(
    options.defaultRoute || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearRoute = useCallback(() => {
    setSelectedRoute(null);
    setError(null);
  }, []);

  const createCustomRoute = useCallback((route: RouteCoordinates) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedRoute(route);
      options.onRouteSelect?.(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create route");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    selectedRoute,
    isLoading,
    error,
    clearRoute,
    createCustomRoute,
  };
};
