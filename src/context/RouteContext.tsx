import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useRouteCalculation } from "@/hooks";

type LatLngLiteral = {
  lat: number;
  lng: number;
};

type Waypoint = {
  id: string;
  location: LatLngLiteral;
};

interface RouteState {
  origin: LatLngLiteral | null;
  destination: LatLngLiteral | null;
  waypoints: Waypoint[];
  routeData: any | null;
  isCalculating: boolean;
  travelMode?: google.maps.TravelMode;
}

interface RouteContextType extends RouteState {
  setOrigin: (location: LatLngLiteral | null) => void;
  setDestination: (location: LatLngLiteral | null) => void;
  addWaypoint: (location: LatLngLiteral) => void;
  removeWaypoint: (id: string) => void;
  clearWaypoints: () => void;
  setTravelMode: (mode: google.maps.TravelMode) => void;
}

const RouteContext = createContext<RouteContextType | null>(null);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [origin, setOrigin] = useState<LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<LatLngLiteral | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<any | null>(null);
  const { calculateRoute, isCalculating } = useRouteCalculation();
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>();

  const addWaypoint = useCallback((location: LatLngLiteral) => {
    const newWaypoint = {
      id: crypto.randomUUID(),
      location,
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
