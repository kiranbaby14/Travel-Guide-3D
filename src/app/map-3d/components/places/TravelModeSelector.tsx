import React from "react";
import { Car, Bike, Footprints } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface TravelModeSelectorProps {
  selectedMode: google.maps.TravelMode;
  onChange: (mode: google.maps.TravelMode) => void;
  disabled?: boolean;
}

const TravelModeSelector: React.FC<TravelModeSelectorProps> = ({
  selectedMode,
  onChange,
  disabled = false,
}) => {
  const modes = [
    {
      mode: google.maps.TravelMode.DRIVING,
      icon: Car,
      label: "Driving",
    },
    {
      mode: google.maps.TravelMode.WALKING,
      icon: Footprints,
      label: "Walking",
    },
    {
      mode: google.maps.TravelMode.BICYCLING,
      icon: Bike,
      label: "Bicycling",
    },
  ];

  return (
    <div className="flex justify-center gap-2">
      {modes.map(({ mode, icon: Icon, label }) => (
        <Toggle
          key={mode}
          pressed={selectedMode === mode}
          onPressedChange={() => onChange(mode)}
          disabled={disabled}
          className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-600"
          aria-label={`Select ${label} mode`}
        >
          <Icon className="h-4 w-4" />
        </Toggle>
      ))}
    </div>
  );
};

export default TravelModeSelector;
