import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";

export interface Polyline3DProps {
  coordinates: google.maps.LatLngLiteral[];
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  strokeColor?: string;
  strokeWidth?: number;
  onClick?: () => void;
}

export const Polyline3D: React.FC<Polyline3DProps> = ({
  coordinates,
  altitudeMode = "RELATIVE_TO_GROUND",
  strokeColor = "rgba(25, 102, 210, 0.75)",
  strokeWidth = 10,
  onClick,
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const polylineRef = useRef<google.maps.maps3d.Polyline3DElement | null>(null);
  const [polylineElementReady, setPolylineElementReady] = useState(false);

  // Handle polyline element initialization
  useEffect(() => {
    if (!maps3d) return;
    customElements
      .whenDefined("gmp-polyline-3d")
      .then(() => setPolylineElementReady(true));
  }, [maps3d]);

  // Handle polyline creation and updates
  useEffect(() => {
    if (!maps3d || !map3DElement || !polylineElementReady) return;

    const createPolyline = async () => {
      if (!polylineRef.current) {
        const polyline = document.createElement(
          "gmp-polyline-3d",
        ) as google.maps.maps3d.Polyline3DElement;
        polylineRef.current = polyline;

        if (onClick) {
          polyline.addEventListener("gmp-click", onClick);
        }
      }

      const polyline = polylineRef.current;

      // Set polyline properties
      polyline.coordinates = coordinates;
      polyline.altitudeMode = maps3d.AltitudeMode[altitudeMode];
      polyline.strokeColor = strokeColor;
      polyline.strokeWidth = strokeWidth;

      // Append to map if not already added
      if (!polyline.parentElement) {
        map3DElement.appendChild(polyline);
      }
    };

    createPolyline();

    // Cleanup
    return () => {
      if (polylineRef.current) {
        if (onClick) {
          polylineRef.current.removeEventListener("gmp-click", onClick);
        }
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    };
  }, [
    maps3d,
    map3DElement,
    polylineElementReady,
    coordinates,
    strokeColor,
    strokeWidth,
    altitudeMode,
    onClick,
  ]);

  return null;
};
