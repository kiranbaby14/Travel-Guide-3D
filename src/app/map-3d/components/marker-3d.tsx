import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";

export interface Marker3DProps {
  position: google.maps.LatLngLiteral;
  title?: string;
  onClick?: () => void;
  altitudeMode?:
    | "ABSOLUTE"
    | "CLAMP_TO_GROUND"
    | "RELATIVE_TO_GROUND"
    | "RELATIVE_TO_MESH";
  altitude?: number;
}

export const Marker3D: React.FC<Marker3DProps> = ({
  position,
  title,
  onClick,
  altitudeMode = "ABSOLUTE",
  altitude = 0,
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const markerRef =
    useRef<google.maps.maps3d.Marker3DInteractiveElement | null>(null);
  const [markerElementReady, setMarkerElementReady] = useState(false);

  // Handle marker element initialization
  useEffect(() => {
    if (!maps3d) return;
    customElements
      .whenDefined("gmp-marker-3d-interactive")
      .then(() => setMarkerElementReady(true));
  }, [maps3d]);

  // Handle marker creation and updates
  useEffect(() => {
    if (!maps3d || !map3DElement || !markerElementReady) return;

    const createMarker = async () => {
      if (!markerRef.current) {
        const marker = new maps3d.Marker3DInteractiveElement();
        markerRef.current = marker;

        if (onClick) {
          marker.addEventListener("gmp-click", onClick);
        }
      }

      const marker = markerRef.current;
      marker.position = {
        ...position,
        altitude: altitude,
      };

      if (title) {
        marker.title = title;
      }

      marker.altitudeMode = maps3d.AltitudeMode[altitudeMode];

      if (!marker.parentElement) {
        map3DElement.appendChild(marker);
      }
    };

    createMarker();

    return () => {
      if (markerRef.current) {
        if (onClick) {
          markerRef.current.removeEventListener("gmp-click", onClick);
        }
        markerRef.current.remove();
      }
    };
  }, [maps3d, map3DElement, markerElementReady]);

  return null;
};
