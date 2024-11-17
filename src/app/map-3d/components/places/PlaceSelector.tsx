import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useMap3D } from "@/context/Map3DContext";
import PlaceInput from "./PlaceInput";
import WaypointItem from "./WaypointItem";
import { useRoute } from "@/context/RouteContext";
import { Lock, MapPin } from "lucide-react";
import TravelModeSelector from "./TravelModeSelector";
import { NamedLocation } from "@/types";

interface PlaceSelectorProps {
  isTourActive?: boolean;
}

const PlaceSelector: React.FC<PlaceSelectorProps> = ({
  isTourActive = false,
}) => {
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement } = useMap3D();
  const {
    origin,
    destination,
    setOrigin,
    setDestination,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    waypoints,
    travelMode,
    setTravelMode,
  } = useRoute();

  const handlePlaceSelect = async (
    location: NamedLocation,
    type: "origin" | "destination" | "waypoint",
  ) => {
    map3DElement!.flyCameraTo({
      endCamera: {
        center: {
          ...location,
          altitude: 1000,
        },
        tilt: 45,
        range: 6000,
      },
      durationMillis: 1000,
    });

    switch (type) {
      case "origin":
        setOrigin(location);
        break;
      case "destination":
        setDestination(location);
        break;
      case "waypoint":
        addWaypoint(location);
        break;
    }
  };

  useEffect(() => {
    if (map3DElement) setTravelMode(google.maps.TravelMode.DRIVING);
  }, [map3DElement]);

  if (!placesLibrary || !map3DElement) return null;

  return (
    <div className="absolute top-4 left-4 z-10">
      <Card className="relative p-4 w-80 space-y-4">
        <div
          className={`absolute inset-0 bg-black/5 backdrop-blur-[1px] rounded-lg flex items-center justify-center transition-opacity duration-300 ${
            isTourActive ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-white/90 px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Route locked during tour
            </span>
          </div>
        </div>

        <TravelModeSelector
          selectedMode={travelMode}
          onChange={setTravelMode}
          disabled={isTourActive}
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin
              className={`h-4 w-4 text-blue-500 flex-shrink-0 ${!origin ? "opacity-30" : ""}`}
            />
            <PlaceInput
              placeholder="Enter starting point"
              onPlaceSelect={(location) =>
                handlePlaceSelect(location, "origin")
              }
              placesLibrary={placesLibrary}
              map3DElement={map3DElement}
              disabled={isTourActive}
            />
          </div>

          <div className="flex items-center gap-2">
            <MapPin
              className={`h-4 w-4 text-red-500 flex-shrink-0 ${!destination ? "opacity-30" : ""}`}
            />
            <PlaceInput
              placeholder="Enter destination"
              onPlaceSelect={(location) =>
                handlePlaceSelect(location, "destination")
              }
              placesLibrary={placesLibrary}
              map3DElement={map3DElement}
              disabled={isTourActive}
            />
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500 opacity-30 flex-shrink-0" />
            <PlaceInput
              placeholder="Add a stop (optional)"
              onPlaceSelect={(location) =>
                handlePlaceSelect(location, "waypoint")
              }
              placesLibrary={placesLibrary}
              map3DElement={map3DElement}
              disabled={isTourActive}
              clearInputOnSelect
            />
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium underline">Stops:</div>
            {waypoints.map((waypoint, index) => (
              <WaypointItem
                key={waypoint.id}
                waypoint={waypoint}
                index={index}
                onRemove={removeWaypoint}
                disabled={isTourActive}
              />
            ))}
            <button
              onClick={clearWaypoints}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTourActive}
            >
              Clear all stops
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export { PlaceSelector };
