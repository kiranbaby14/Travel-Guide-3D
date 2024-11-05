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

  const selectRoute = useCallback(
    (route: RouteCoordinates) => {
      setSelectedRoute(route);
      options.onRouteSelect?.(route);
    },
    [options],
  );

  const clearRoute = useCallback(() => {
    setSelectedRoute(null);
    setError(null);
  }, []);

  const createCustomRoute = useCallback(
    (
      origin: LatLngLiteral,
      destination: LatLngLiteral,
      waypoints?: LatLngLiteral[],
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const newRoute = {
          origin,
          destination,
          waypoints,
        };

        setSelectedRoute(newRoute);
        options.onRouteSelect?.(newRoute);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create route");
      } finally {
        setIsLoading(false);
      }
    },
    [options],
  );

  return {
    selectedRoute,
    isLoading,
    error,
    selectRoute,
    clearRoute,
    createCustomRoute,
  };
};
