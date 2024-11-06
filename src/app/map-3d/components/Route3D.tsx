// map-3d/components/Route3D.tsx
import React from "react";
import { Polyline3D } from "./Polyline3D";

interface Route3DProps {
  routeCoordinates: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeWidth?: number;
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  onClick?: () => void;
}

export const Route3D: React.FC<Route3DProps> = ({
  routeCoordinates,
  strokeColor = "rgba(25, 102, 210, 0.75)",
  strokeWidth = 10,
  altitudeMode = "RELATIVE_TO_GROUND",
  onClick,
}) => {
  if (routeCoordinates.length === 0) return null;

  return (
    <Polyline3D
      coordinates={routeCoordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      altitudeMode={altitudeMode}
      onClick={onClick}
    />
  );
};
