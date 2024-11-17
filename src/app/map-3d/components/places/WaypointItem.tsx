import React from "react";
import { X } from "lucide-react";
import { Waypoint } from "@/types";

interface WaypointItemProps {
  waypoint: Waypoint;
  index: number;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const WaypointItem: React.FC<WaypointItemProps> = React.memo(
  ({ waypoint, index, onRemove, disabled = false }) => (
    <div className="text-sm flex justify-between items-center">
      <span>
        Stop {index + 1}: {waypoint.name}
      </span>
      <button
        onClick={() => onRemove(waypoint.id)}
        className="ml-2 text-red-600 hover:text-red-800"
        aria-label={`Remove stop ${index + 1}`}
        disabled={disabled}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ),
);

WaypointItem.displayName = "WaypointItem";

export default WaypointItem;
