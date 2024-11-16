// src/map-3d/components/polygon.tsx
import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";

export interface Polygon3DProps {
  outerCoordinates: google.maps.LatLngAltitudeLiteral[];
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  extruded?: boolean;
  onClick?: () => void;
}

export const Polygon3D: React.FC<Polygon3DProps> = ({
  outerCoordinates,
  altitudeMode = "RELATIVE_TO_GROUND",
  fillColor = "rgba(66, 133, 244, 0.45)",
  strokeColor = "rgba(25, 103, 210, 0.8)",
  strokeWidth = 1.5,
  extruded = true,
  onClick,
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const polygonRef = useRef<google.maps.maps3d.Polygon3DElement | null>(null);
  const [polygonElementReady, setPolygonElementReady] = useState(false);

  // Handle polygon element initialization
  useEffect(() => {
    if (!maps3d) return;
    customElements
      .whenDefined("gmp-polygon-3d")
      .then(() => setPolygonElementReady(true));
  }, [maps3d]);

  // Handle polygon creation and updates
  useEffect(() => {
    if (!maps3d || !map3DElement || !polygonElementReady) return;

    const createPolygon = async () => {
      if (!polygonRef.current) {
        const polygon = document.createElement(
          "gmp-polygon-3d",
        ) as google.maps.maps3d.Polygon3DElement;
        polygonRef.current = polygon;

        if (onClick) {
          polygon.addEventListener("gmp-click", onClick);
        }
      }

      const polygon = polygonRef.current;

      // Set polygon properties
      polygon.outerCoordinates = outerCoordinates;
      polygon.altitudeMode = maps3d.AltitudeMode[altitudeMode];
      polygon.fillColor = fillColor;
      polygon.strokeColor = strokeColor;
      polygon.strokeWidth = strokeWidth;
      polygon.extruded = extruded;

      // Append to map if not already added
      if (!polygon.parentElement) {
        map3DElement.appendChild(polygon);
      }
    };

    createPolygon();

    // Cleanup
    return () => {
      if (polygonRef.current) {
        if (onClick) {
          polygonRef.current.removeEventListener("gmp-click", onClick);
        }
        polygonRef.current.remove();
        polygonRef.current = null;
      }
    };
  }, [maps3d, map3DElement, polygonElementReady]);

  return null;
};
