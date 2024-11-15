import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

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
  color?: string;
}

export const Marker3D: React.FC<Marker3DProps> = ({
  position,
  title,
  onClick,
  altitudeMode = "ABSOLUTE",
  altitude = 0,
  color = "#EA4335",
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const markerLib = useMapsLibrary("marker");
  const markerRef =
    useRef<google.maps.maps3d.Marker3DInteractiveElement | null>(null);
  const [markerElementReady, setMarkerElementReady] = useState(false);

  // Handle marker element initialization
  useEffect(() => {
    if (!maps3d) return;
    customElements
      .whenDefined("gmp-marker-3d-interactive")
      .then(() => setMarkerElementReady(true));
  }, [maps3d, markerLib]);

  // Handle marker creation and updates
  useEffect(() => {
    if (!maps3d || !map3DElement || !markerElementReady || !markerLib) return;

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

      if (color) {
        const pin = new markerLib.PinElement({
          background: color,
          glyphColor: "white",
          borderColor: "#f6f7f6",
        });
        // Clear existing children
        while (marker.firstChild) {
          marker.removeChild(marker.firstChild);
        }
        marker.append(pin);
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
