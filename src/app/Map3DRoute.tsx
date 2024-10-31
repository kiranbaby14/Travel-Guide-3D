"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, MapMouseEvent } from "@vis.gl/react-google-maps";
import { MiniMap } from "./minimap";
import { Map3D, Map3DCameraProps } from "./map-3d";
import "./style.css";
import { Map3DClickEvent } from "./map-3d/use-map-3d-click-events";

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

  const handleMap3DClick = useCallback((event: Map3DClickEvent) => {
    console.log("Map clicked:", event.position);
    // Do something with the click event
  }, []);

  return (
    <>
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        onClick={handleMap3DClick}
        defaultLabelsDisabled
      />

      <MiniMap camera3dProps={viewProps} onMapClick={handleMapClick}></MiniMap>
    </>
  );
};

const Map3DRoute = () => {
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
      <Map3DExample />
    </APIProvider>
  );
};
export default Map3DRoute;
