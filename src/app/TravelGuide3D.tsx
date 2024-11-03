"use client";
import React, { useCallback, useState } from "react";
import { APIProvider, MapMouseEvent } from "@vis.gl/react-google-maps";
import { MiniMap } from "./minimap";
import { Map3D, Map3DCameraProps, Marker3D } from "./map-3d";
import { Map3DClickEvent } from "./map-3d/hooks/use-map-3d-click-events";
import { Map3DProvider, useMap3D } from "@/context/Map3DContext";

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
// Separate the part that needs context
const MapControls = () => {
  const { flyCameraTo } = useMap3D();

  const handleFlyToSFO = useCallback(() => {
    flyCameraTo({
      endCamera: {
        center: { lat: 40.7079, lng: -74.0132, altitude: 1300 },
        tilt: 67.5,
        range: 1000,
      },
      durationMillis: 5000,
    });
  }, [flyCameraTo]);

  return (
    <button
      className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow"
      onClick={handleFlyToSFO}
    >
      Fly to Location
    </button>
  );
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
  }, []);

  return (
    <div className="relative w-full h-full">
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        onClick={handleMap3DClick}
        defaultLabelsDisabled
      >
        <Marker3D
          position={{ lat: 40.7079, lng: -74.0132 }}
          title="Paris"
          onClick={handleMarkerClick}
        />
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
