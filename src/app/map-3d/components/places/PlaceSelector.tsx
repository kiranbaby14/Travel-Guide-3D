import React from "react";
import { Card } from "@/components/ui/card";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useMap3D } from "@/context/Map3DContext";
import PlaceInput from "./PlaceInput";
import WaypointItem from "./WaypointItem";
import { Location } from "./types";
import { useRoute } from "@/context/RouteContext";

const PlaceSelector = () => {
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement } = useMap3D();
  const {
    setOrigin,
    setDestination,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    waypoints,
    routeData,
  } = useRoute();

  const handlePlaceSelect = async (
    location: Location,
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
      durationMillis: 5000,
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

  if (!placesLibrary || !map3DElement) return null;

  return (
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
          onPlaceSelect={(location) => handlePlaceSelect(location, "waypoint")}
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
              onRemove={removeWaypoint}
            />
          ))}
          <button
            onClick={clearWaypoints}
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
  );
};

export { PlaceSelector };
