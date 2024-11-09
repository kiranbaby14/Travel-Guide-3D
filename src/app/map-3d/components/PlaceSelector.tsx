import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useMap3D } from "@/context/Map3DContext";

interface Location {
  lat: number;
  lng: number;
}

interface Waypoint {
  id: string;
  location: Location;
}

interface PlaceSelectionProps {
  onOriginSelect: (location: Location) => void;
  onDestinationSelect: (location: Location) => void;
  onWaypointSelect?: (location: Location) => void;
  onClearWaypoints?: () => void;
}

type TFlyCameraOptions = {
  endCamera: {
    center: google.maps.LatLngAltitudeLiteral;
    tilt: number;
    range: number;
  };
  durationMillis?: number;
};

// Custom hook for managing place autocomplete
const usePlaceAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement>,
  placesLibrary: google.maps.PlacesLibrary,
  map3DElement: google.maps.maps3d.Map3DElement,
  flyCameraTo: (options: TFlyCameraOptions) => void,
  onPlaceSelect: (location: Location) => void,
) => {
  useEffect(() => {
    if (!placesLibrary || !map3DElement || !inputRef.current) return;

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      bounds: map3DElement.bounds as google.maps.LatLngBounds,
      fields: ["geometry", "name", "formatted_address"],
      types: ["establishment", "geocode"],
    };

    const autocomplete = new placesLibrary.Autocomplete(
      inputRef.current,
      autocompleteOptions,
    );

    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // Notify about the selected place
        onPlaceSelect(location);

        // Use the context's flyCameraTo
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

        // Clear input for waypoints only
        if (inputRef.current?.placeholder?.includes("stop")) {
          inputRef.current.value = "";
        }

        console.log("Selected place:", {
          name: place.name,
          address: place.formatted_address,
          location: location,
        });
      }
    };

    autocomplete.addListener("place_changed", handlePlaceChanged);

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [placesLibrary, map3DElement, flyCameraTo, onPlaceSelect]);
};

// Input component with autocomplete
const PlaceInput = React.memo(
  ({
    placeholder,
    onPlaceSelect,
    placesLibrary,
    map3DElement,
    flyCameraTo,
  }: {
    placeholder: string;
    onPlaceSelect: (location: Location) => void;
    placesLibrary: google.maps.PlacesLibrary;
    map3DElement: google.maps.maps3d.Map3DElement;
    flyCameraTo: (options: TFlyCameraOptions) => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    usePlaceAutocomplete(
      inputRef,
      placesLibrary,
      map3DElement,
      flyCameraTo,
      onPlaceSelect,
    );

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

// Waypoint item component
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

// Main PlaceSelector component
const PlaceSelector: React.FC<PlaceSelectionProps> = ({
  onOriginSelect,
  onDestinationSelect,
  onWaypointSelect,
  onClearWaypoints,
}) => {
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement, flyCameraTo } = useMap3D();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const handleWaypointSelect = (location: Location) => {
    if (onWaypointSelect) {
      const newWaypoint = {
        id: crypto.randomUUID(),
        location,
      };
      setWaypoints((prev) => [...prev, newWaypoint]);
      onWaypointSelect(location);
    }
  };

  const handleRemoveWaypoint = (id: string) => {
    const newWaypoints = waypoints.filter((wp) => wp.id !== id);
    setWaypoints(newWaypoints);
    if (newWaypoints.length === 0) {
      onClearWaypoints?.();
    }
  };

  if (!placesLibrary || !map3DElement || !flyCameraTo) return null;

  return (
    <Card className="absolute top-4 left-4 z-10 p-4 w-80 space-y-4">
      <div className="space-y-2">
        <PlaceInput
          placeholder="Enter starting point"
          onPlaceSelect={onOriginSelect}
          placesLibrary={placesLibrary}
          map3DElement={map3DElement}
          flyCameraTo={flyCameraTo}
        />
        <PlaceInput
          placeholder="Enter destination"
          onPlaceSelect={onDestinationSelect}
          placesLibrary={placesLibrary}
          map3DElement={map3DElement}
          flyCameraTo={flyCameraTo}
        />
        <PlaceInput
          placeholder="Add a stop (optional)"
          onPlaceSelect={handleWaypointSelect}
          placesLibrary={placesLibrary}
          map3DElement={map3DElement}
          flyCameraTo={flyCameraTo}
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
            onClick={() => {
              setWaypoints([]);
              onClearWaypoints?.();
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear all stops
          </button>
        </div>
      )}
    </Card>
  );
};

export { PlaceSelector };
