import React, { useEffect, useRef } from "react";
import { NamedLocation } from "@/types";

interface PlaceInputProps {
  placeholder: string;
  onPlaceSelect: (location: NamedLocation) => void;
  placesLibrary: google.maps.PlacesLibrary;
  map3DElement: google.maps.maps3d.Map3DElement;
  disabled?: boolean;
  clearInputOnSelect?: boolean;
}

const PlaceInput: React.FC<PlaceInputProps> = React.memo(
  ({
    placeholder,
    onPlaceSelect,
    placesLibrary,
    map3DElement,
    disabled = false,
    clearInputOnSelect = false,
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
          const location: NamedLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name! || place.formatted_address!,
          };

          if (clearInputOnSelect) {
            inputRef.current!.value = "";
          }
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
        disabled={disabled}
      />
    );
  },
);

PlaceInput.displayName = "PlaceInput";

export default PlaceInput;
