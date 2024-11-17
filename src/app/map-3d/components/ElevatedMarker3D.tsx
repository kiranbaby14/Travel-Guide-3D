import React, { useEffect, useRef, useState } from "react";
import { useMap3D } from "@/context/Map3DContext";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Polygon3D } from "./Polygon3D";

export interface ElevatedMarker3DProps {
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
  scale?: number;
  glyph?: string;
  showAnchorLine?: boolean;
  anchorLineWidth?: number;
}

export const ElevatedMarker3D: React.FC<ElevatedMarker3DProps> = ({
  position,
  title,
  onClick,
  altitudeMode = "RELATIVE_TO_MESH",
  altitude = 100, // Default higher altitude
  color = "#EA4335",
  scale = 1,
  glyph,
  showAnchorLine = true,
  anchorLineWidth = 2,
}) => {
  const { map3DElement, maps3d } = useMap3D();
  const markerLib = useMapsLibrary("marker");
  const markerRef =
    useRef<google.maps.maps3d.Marker3DInteractiveElement | null>(null);
  const [markerElementReady, setMarkerElementReady] = useState(false);

  // Create anchor line coordinates
  const getAnchorLineCoordinates = (): google.maps.LatLngAltitudeLiteral[] => {
    return [
      { ...position, altitude: altitude }, // Top point (marker position)
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
      marker.position = {
        ...position,
        altitude: altitude,
      };

      if (title) {
        marker.title = title;
      }

      const pin = new markerLib.PinElement({
        background: color,
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: scale,
        glyph: glyph,
      });

      while (marker.firstChild) {
        marker.removeChild(marker.firstChild);
      }

      marker.append(pin);
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
  }, [
    maps3d,
    map3DElement,
    markerElementReady,
    markerLib,
    position,
    title,
    color,
    scale,
    glyph,
    altitude,
    altitudeMode,
  ]);

  return (
    <>
      {/* Render anchor line if enabled */}
      {showAnchorLine && (
        <Polygon3D
          outerCoordinates={getAnchorLineCoordinates()}
          fillColor="transparent"
          strokeColor={color}
        />
      )}
    </>
  );
};
