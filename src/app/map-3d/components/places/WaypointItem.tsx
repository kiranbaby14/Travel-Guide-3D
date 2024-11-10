import React from "react";
import { Waypoint } from "./types";

interface WaypointItemProps {
  waypoint: Waypoint;
  index: number;
  onRemove: (id: string) => void;
}

const WaypointItem: React.FC<WaypointItemProps> = React.memo(
  ({ waypoint, index, onRemove }) => (
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

export default WaypointItem;
