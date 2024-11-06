// components/RouteWithMarkers.tsx
import React from "react";
import { Marker3D } from "./Marker3D";
import { Route3D } from "./Route3D";

interface RouteWithMarkersProps {
  routeCoordinates: google.maps.LatLngLiteral[];
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  waypoints?: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeWidth?: number;
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  showMarkers?: boolean;
  originMarkerTitle?: string;
  destinationMarkerTitle?: string;
  onRouteClick?: () => void;
  onOriginMarkerClick?: () => void;
  onDestinationMarkerClick?: () => void;
  onMarkerClick?: (
    type: "origin" | "destination" | "waypoint",
    index?: number,
  ) => void;
}

export const RouteWithMarkers = React.memo(
  ({
    routeCoordinates,
    origin,
    destination,
    waypoints,
    strokeColor = "rgba(66, 133, 244, 0.8)",
    strokeWidth = 8,
    altitudeMode = "RELATIVE_TO_GROUND",
    showMarkers = true,
    originMarkerTitle = "Origin",
    destinationMarkerTitle = "Destination",
    onRouteClick,
    onOriginMarkerClick,
    onDestinationMarkerClick,
    onMarkerClick,
  }: RouteWithMarkersProps) => {
    const handleMarkerClick =
      (type: "origin" | "destination" | "waypoint", index?: number) => () => {
        onMarkerClick?.(type, index);
      };
    return (
      <>
        <Route3D
          routeCoordinates={routeCoordinates}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          altitudeMode={altitudeMode}
          onClick={onRouteClick}
        />
        {showMarkers && (
          <>
            <Marker3D
              position={origin}
              title={originMarkerTitle}
              onClick={onOriginMarkerClick}
            />

            {/* Waypoint Markers */}
            {waypoints?.map((waypoint, index) => (
              <Marker3D
                key={`waypoint-${index}`}
                position={waypoint}
                title={`Stop ${index + 1}`}
                onClick={handleMarkerClick("waypoint", index)}
              />
            ))}

            <Marker3D
              position={destination}
              title={destinationMarkerTitle}
              onClick={onDestinationMarkerClick}
            />
          </>
        )}
      </>
    );
  },
);

RouteWithMarkers.displayName = "RouteWithMarkers";
