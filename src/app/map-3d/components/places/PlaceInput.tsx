import React, { useEffect, useRef } from "react";
import { Location } from "./types";

interface PlaceInputProps {
  placeholder: string;
  onPlaceSelect: (location: Location) => void;
  placesLibrary: google.maps.PlacesLibrary;
  map3DElement: google.maps.maps3d.Map3DElement;
}

const PlaceInput: React.FC<PlaceInputProps> = React.memo(
  ({ placeholder, onPlaceSelect, placesLibrary, map3DElement }) => {
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
          const location: Location = {
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
export default PlaceInput;
