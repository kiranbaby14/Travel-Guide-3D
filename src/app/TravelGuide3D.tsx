"use client";
import React, { useCallback, useMemo, useState } from "react";
import { APIProvider, MapMouseEvent } from "@vis.gl/react-google-maps";
import { MiniMap } from "./minimap";
import {
  Map3D,
  Map3DCameraProps,
  MapControls,
  Marker3D,
  Polygon3D,
  Polyline3D,
} from "./map-3d";
import { Map3DClickEvent } from "./map-3d/hooks/useMap3DClickEvents";
import { Map3DProvider } from "@/context/Map3DContext";

const API_KEY =
  globalThis.GOOGLE_MAPS_API_KEY ??
  (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string);

const INITIAL_VIEW_PROPS = {
  center: { lat: 40.7079, lng: -74.0132, altitude: 1300 },
  range: 5000,
  heading: 61,
  tilt: 69,
  roll: 0,
};

const Map3DExample = () => {
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps((oldProps) => ({ ...oldProps, ...props }));
  }, []);

  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (!ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;
    setViewProps((p) => ({ ...p, center: { lat, lng, altitude: 0 } }));
  }, []);

  const handleMarkerClick = useCallback(() => {
    console.log("Marker clicked!");
  }, []);

  const handleMap3DClick = useCallback(async (event: Map3DClickEvent) => {
    console.log("Map clicked:", event.position, event.placeId);
    if (event.placeId) {
      const place = await event.fetchPlace();
      await place.fetchFields({ fields: ["*"] });
      // Display place details or do something else.
      console.log(place);
    }
  }, []);

  const handlePolygonClick = useCallback(() => {
    console.log("Polygon clicked!");
  }, []);

  // Memoize the components
  const memoizedMarker = useMemo(
    () => (
      <Marker3D
        position={{ lat: 40.7079, lng: -74.0132 }}
        title="Paris"
        onClick={handleMarkerClick}
      />
    ),
    [],
  );

  const memoizedPolygon = useMemo(
    () => (
      <Polygon3D
        outerCoordinates={[
          { lat: 40.7144, lng: -74.0208, altitude: 1000 },
          { lat: 40.6993, lng: -74.019, altitude: 1000 },
          { lat: 40.7035, lng: -74.0004, altitude: 1000 },
          { lat: 40.7144, lng: -74.0208, altitude: 1000 },
        ]}
        fillColor="rgba(255, 0, 0, 0.5)"
        strokeColor="#0000ff"
        strokeWidth={8}
        extruded={true}
        onClick={handlePolygonClick}
      />
    ),
    [],
  );

  const memoizedPolyline = useMemo(
    () => (
      <Polyline3D
        coordinates={[
          // Financial District loop
          { lat: 40.7144, lng: -74.0208 }, // One World Trade Center area
          { lat: 40.7075, lng: -74.0021 }, // Near Brooklyn Bridge
          { lat: 40.7033, lng: -74.0123 }, // Battery Park area
          { lat: 40.7127, lng: -74.0134 }, // TriBeCa

          // Midpoint landmarks
          { lat: 40.7196, lng: -74.0066 }, // SoHo
          { lat: 40.7233, lng: -73.9989 }, // Greenwich Village

          // Lower East Side loop
          { lat: 40.7169, lng: -73.9873 }, // Lower East Side
          { lat: 40.7112, lng: -73.9939 }, // Chinatown
          { lat: 40.7135, lng: -74.0021 }, // Little Italy
          { lat: 40.7144, lng: -74.0208 }, // Back to start
        ]}
        strokeColor="rgba(25, 102, 210, 0.75)"
        strokeWidth={10}
        altitudeMode="RELATIVE_TO_GROUND"
        onClick={() => console.log("Polyline clicked!")}
      />
    ),
    [],
  );

  return (
    <div className="relative w-full h-full">
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        onClick={handleMap3DClick}
        // defaultLabelsDisabled
      >
        {memoizedMarker}
        {/* {memoizedPolygon} */}
        {memoizedPolyline}
      </Map3D>
      <MapControls />
      <MiniMap camera3dProps={viewProps} onMapClick={handleMapClick}></MiniMap>
    </div>
  );
};

const TravelGuide3D = () => {
  const nonAlphaVersionLoaded = Boolean(
    globalThis &&
      globalThis.google?.maps?.version &&
      !globalThis.google?.maps?.version.endsWith("-alpha"),
  );

  if (nonAlphaVersionLoaded) {
    location.reload();
    return;
  }

  return (
    <APIProvider apiKey={API_KEY} version={"alpha"}>
      <Map3DProvider>
        <div className="w-screen h-screen">
          <Map3DExample />
        </div>
      </Map3DProvider>
    </APIProvider>
  );
};
export default TravelGuide3D;
