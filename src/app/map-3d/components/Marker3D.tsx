import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Polygon3D } from "./Polygon3D";

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
  elevated?: boolean;
  scale?: number;
  glyph?: string;
  showAnchorLine?: boolean;
  anchorLineWidth?: number;
}

export const Marker3D: React.FC<Marker3DProps> = ({
  position,
  title,
  onClick,
  altitudeMode = "RELATIVE_TO_MESH",
  altitude = 0,
  color = "#EA4335",
  elevated = false,
  scale = 1,
  glyph,
  showAnchorLine = true,
  // anchorLineWidth = 2,
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const markerLib = useMapsLibrary("marker");
  const markerRef =
    useRef<google.maps.maps3d.Marker3DInteractiveElement | null>(null);
  const [markerElementReady, setMarkerElementReady] = useState(false);

  // Use elevated settings if elevated prop is true
  const effectiveAltitude = elevated ? altitude || 30 : altitude;

  // Create anchor line coordinates for elevated markers
  const getAnchorLineCoordinates = (): google.maps.LatLngAltitudeLiteral[] => {
    return [
      { ...position, altitude: effectiveAltitude }, // Top point (marker position)
      { ...position, altitude: 0 }, // Ground point
    ];
  };

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
      if (!marker) return; // Early return if marker is somehow null

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
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          scale: scale,
          glyph: glyph,
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

  return (
    <>
      {/* Render anchor line if marker is elevated and showAnchorLine is true */}
      {elevated && showAnchorLine && (
        <Polygon3D
          outerCoordinates={getAnchorLineCoordinates()}
          strokeColor="white"
          extruded={true}
          zIndex={1}
        />
      )}
    </>
  );
};
