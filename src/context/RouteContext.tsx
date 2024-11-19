import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useRouteCalculation } from "@/hooks";
import { Location, NamedLocation, RouteData, Waypoint } from "@/types";

interface RouteState {
  origin: Location | null;
  destination: Location | null;
  waypoints: Waypoint[];
  routeData: RouteData | null;
  isCalculating: boolean;
  travelMode: google.maps.TravelMode;
}

interface RouteContextType extends RouteState {
  setOrigin: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  addWaypoint: (location: NamedLocation) => void;
  removeWaypoint: (id: string) => void;
  clearWaypoints: () => void;
  setTravelMode: (mode: google.maps.TravelMode) => void;
}

const RouteContext = createContext<RouteContextType | null>(null);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const { calculateRoute, isCalculating } = useRouteCalculation();
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
    "DRIVING" as google.maps.TravelMode,
  );

  const addWaypoint = useCallback((location: NamedLocation) => {
    const newWaypoint = {
      id: crypto.randomUUID(),
      location,
      name: location.name,
    };
    setWaypoints((prev) => [...prev, newWaypoint]);
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  }, []);

  const clearWaypoints = useCallback(() => {
    setWaypoints([]);
  }, []);

  // Automatically calculate route when points change
  useEffect(() => {
    const updateRoute = async () => {
      if (origin && destination) {
        const result = await calculateRoute({
          origin,
          destination,
          waypoints: waypoints.map((wp) => wp.location),
          travelMode, // Use the selected travel mode
        });

        if (result) {
          setRouteData(result);
        }
      }
    };

    updateRoute();
  }, [origin, destination, waypoints, travelMode]);

  const value = {
    origin,
    destination,
    waypoints,
    routeData,
    isCalculating,
    travelMode,
    setOrigin,
    setDestination,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    setTravelMode,
  };

  return (
    <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === null) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
};
