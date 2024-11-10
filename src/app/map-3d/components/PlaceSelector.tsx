import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useMap3D } from "@/context/Map3DContext";
import { Marker3D } from "./Marker3D";
import { Polyline3D } from "./Polyline3D";
import { useRouteCalculation } from "../hooks";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
}

interface Waypoint {
  id: string;
  location: Location;
}

interface PlaceSelectionProps {
  onOriginSelect?: (location: Location) => void;
  onDestinationSelect?: (location: Location) => void;
  onWaypointSelect?: (location: Location) => void;
  onClearWaypoints?: () => void;
  animateAlongPath: (
    path: google.maps.LatLng[],
    options?: {
      duration?: number;
      cameraHeight?: number;
      cameraDistance?: number;
      tilt?: number;
      smoothing?: number;
    },
  ) => void;
  stopAnimation: () => void;
  togglePause: () => void;
  isAnimating?: boolean;
  isPaused?: boolean;
}

const PlaceSelector: React.FC<PlaceSelectionProps> = ({
  onOriginSelect,
  onDestinationSelect,
  onWaypointSelect,
  onClearWaypoints,
  animateAlongPath,
  stopAnimation,
  togglePause,
  isAnimating = false,
  isPaused = false,
}) => {
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement, flyCameraTo } = useMap3D();
  const { calculateRoute, routeData, isCalculating } = useRouteCalculation();

  // State for locations and route
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  // Update route when locations change
  useEffect(() => {
    if (origin && destination) {
      calculateRoute({
        origin,
        destination,
        waypoints: waypoints.map((wp) => wp.location),
        travelMode: google.maps.TravelMode.DRIVING,
      });
    }
  }, [origin, destination, waypoints, calculateRoute]);

  const handleStartTour = () => {
    console.log(routeData?.overview_path);
    if (routeData?.overview_path) {
      animateAlongPath(routeData.overview_path, {
        duration: 100000,
        cameraHeight: 150,
        cameraDistance: 150,
        tilt: 45,
        smoothing: 5,
      });
    }
  };

  const handlePlaceSelect = async (
    location: Location,
    type: "origin" | "destination" | "waypoint",
  ) => {
    // Fly to selected location
    flyCameraTo({
      endCamera: {
        center: {
          ...location,
          altitude: 1000,
        },
        tilt: 45,
        range: 2000,
      },
    });

    // Update state based on selection type
    switch (type) {
      case "origin":
        setOrigin(location);
        onOriginSelect?.(location);
        break;
      case "destination":
        setDestination(location);
        onDestinationSelect?.(location);
        break;
      case "waypoint":
        const newWaypoint = {
          id: crypto.randomUUID(),
          location,
        };
        setWaypoints((prev) => [...prev, newWaypoint]);
        onWaypointSelect?.(location);
        break;
    }
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  };

  const clearAllWaypoints = () => {
    setWaypoints([]);
    onClearWaypoints?.();
  };

  if (!placesLibrary || !map3DElement || !flyCameraTo) return null;

  return (
    <>
      <Card className="absolute top-4 left-4 z-10 p-4 w-80 space-y-4">
        <div className="space-y-2">
          <PlaceInput
            placeholder="Enter starting point"
            onPlaceSelect={(location) => handlePlaceSelect(location, "origin")}
            placesLibrary={placesLibrary}
            map3DElement={map3DElement}
          />
          <PlaceInput
            placeholder="Enter destination"
            onPlaceSelect={(location) =>
              handlePlaceSelect(location, "destination")
            }
            placesLibrary={placesLibrary}
            map3DElement={map3DElement}
          />
          <PlaceInput
            placeholder="Add a stop (optional)"
            onPlaceSelect={(location) =>
              handlePlaceSelect(location, "waypoint")
            }
            placesLibrary={placesLibrary}
            map3DElement={map3DElement}
          />
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Stops:</div>
            {waypoints.map((waypoint, index) => (
              <WaypointItem
                key={waypoint.id}
                waypoint={waypoint}
                index={index}
                onRemove={handleRemoveWaypoint}
              />
            ))}
            <button
              onClick={clearAllWaypoints}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all stops
            </button>
          </div>
        )}

        {routeData && (
          <div className="text-sm space-y-1">
            <div>Distance: {routeData.distance}</div>
            <div>Duration: {routeData.duration}</div>
          </div>
        )}
      </Card>

      {/* Tour Controls */}
      {routeData && !isCalculating && (
        <div className="absolute bottom-8 right-8 z-10 space-y-2">
          <div className="flex gap-2">
            {!isAnimating ? (
              // Start button
              <Button
                onClick={handleStartTour}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                Start Tour
              </Button>
            ) : (
              <>
                {/* Pause/Resume button */}
                <Button
                  onClick={togglePause}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                {/* Stop button */}
                <Button
                  onClick={stopAnimation}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
          {routeData && (
            <div className="bg-white/90 p-2 rounded shadow text-sm text-center">
              {routeData.distance} • {routeData.duration}
            </div>
          )}
        </div>
      )}

      {/* Markers and Route */}
      {origin && (
        <Marker3D
          position={origin}
          title="Origin"
          altitude={50}
          altitudeMode="RELATIVE_TO_GROUND"
        />
      )}
      {destination && (
        <Marker3D
          position={destination}
          title="Destination"
          altitude={50}
          altitudeMode="RELATIVE_TO_GROUND"
        />
      )}
      {waypoints.map((waypoint) => (
        <Marker3D
          key={waypoint.id}
          position={waypoint.location}
          title="Waypoint"
          altitude={50}
          altitudeMode="RELATIVE_TO_GROUND"
        />
      ))}
      {routeData && (
        <Polyline3D
          coordinates={routeData.routeCoordinates}
          strokeColor="rgba(25, 102, 210, 0.75)"
          strokeWidth={10}
          altitudeMode="RELATIVE_TO_GROUND"
        />
      )}
    </>
  );
};

// PlaceInput component implementation (same as before)
const PlaceInput = React.memo(
  ({
    placeholder,
    onPlaceSelect,
    placesLibrary,
    map3DElement,
  }: {
    placeholder: string;
    onPlaceSelect: (location: Location) => void;
    placesLibrary: google.maps.PlacesLibrary;
    map3DElement: google.maps.maps3d.Map3DElement;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (!placesLibrary || !map3DElement || !inputRef.current) return;

      const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
        bounds: map3DElement.bounds as google.maps.LatLngBounds,
        fields: ["geometry", "name", "formatted_address"],
        types: ["establishment", "geocode"],
      });

      const handlePlaceChanged = () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          onPlaceSelect(location);
        }
      };

      autocomplete.addListener("place_changed", handlePlaceChanged);

      return () => {
        google.maps.event.clearInstanceListeners(autocomplete);
      };
    }, [placesLibrary, map3DElement, onPlaceSelect]);

    return (
      <input
        ref={inputRef}
        className="w-full p-2 border rounded"
        placeholder={placeholder}
      />
    );
  },
);

PlaceInput.displayName = "PlaceInput";

// WaypointItem component (same as before)
const WaypointItem = React.memo(
  ({
    waypoint,
    index,
    onRemove,
  }: {
    waypoint: Waypoint;
    index: number;
    onRemove: (id: string) => void;
  }) => (
    <div className="text-sm flex justify-between items-center">
      <span>
        Stop {index + 1}: ({waypoint.location.lat.toFixed(4)},{" "}
        {waypoint.location.lng.toFixed(4)})
      </span>
      <button
        onClick={() => onRemove(waypoint.id)}
        className="ml-2 text-red-600 hover:text-red-800"
        aria-label={`Remove stop ${index + 1}`}
      >
        ×
      </button>
    </div>
  ),
);

WaypointItem.displayName = "WaypointItem";

export { PlaceSelector };
