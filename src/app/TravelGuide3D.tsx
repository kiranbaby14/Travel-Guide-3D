"use client";
import React, { useCallback, useMemo, useState } from "react";
import {
  APIProvider,
  MapMouseEvent,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MiniMap } from "./minimap";
import {
  Map3D,
  Map3DCameraProps,
  PlaceSelector,
  RouteDisplay,
  TourControls,
  useCameraAnimation,
} from "./map-3d";
import { Map3DProvider, useMap3D } from "@/context/Map3DContext";
import { RouteProvider, useRoute } from "@/context/RouteContext";
import { RouteNarrator } from "./map-3d/components/RouteNarrator ";

const API_KEY =
  globalThis.GOOGLE_MAPS_API_KEY ??
  (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string);

const INITIAL_VIEW_PROPS = {
  center: { lat: 51.5072, lng: 0.1276, altitude: 1300 },
  range: 5000,
  heading: 61,
  tilt: 69,
  roll: 0,
};

const Map3DExample = () => {
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement } = useMap3D();
  const { isCalculating, routeData } = useRoute();
  const [currentPosition, setCurrentPosition] =
    useState<google.maps.LatLngLiteral | null>(null);

  const placesService = useMemo(() => {
    if (placesLibrary && map3DElement) {
      return new placesLibrary.PlacesService(map3DElement);
    }
    return null;
  }, [placesLibrary, map3DElement]);

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps((oldProps) => ({ ...oldProps, ...props }));
    // Update current position based on camera center
    if (props.center) {
      setCurrentPosition({
        lat: props.center.lat,
        lng: props.center.lng,
      });
    }
  }, []);

  const {
    animateAlongPath,
    isAnimating,
    isPaused,
    stopAnimation,
    togglePause,
  } = useCameraAnimation(handleCameraChange);

  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (!ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;
    setViewProps((p) => ({ ...p, center: { lat, lng, altitude: 0 } }));
  }, []);

  const handleStartTour = () => {
    if (routeData?.overview_path) {
      // Set initial position
      if (routeData.overview_path[0]) {
        setCurrentPosition({
          lat: routeData.overview_path[0].lat(),
          lng: routeData.overview_path[0].lng(),
        });
      }
      animateAlongPath(routeData.overview_path, {
        duration: 100000,
        cameraHeight: 150,
        cameraDistance: 150,
        tilt: 45,
        smoothing: 5,
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        defaultLabelsDisabled
      >
        <RouteDisplay />
      </Map3D>
      <PlaceSelector />
      {routeData && !isCalculating && (
        <TourControls
          isAnimating={isAnimating}
          isPaused={isPaused}
          routeData={routeData}
          onStart={handleStartTour}
          onTogglePause={togglePause}
          onStop={stopAnimation}
        />
      )}
      {/* Add RouteNarrator when animation is active */}
      {isAnimating && currentPosition && routeData && placesService && (
        <RouteNarrator
          currentPosition={currentPosition}
          routeData={routeData}
          placesService={placesService}
        />
      )}
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
        <RouteProvider>
          <div className="w-screen h-screen">
            <Map3DExample />
          </div>
        </RouteProvider>
      </Map3DProvider>
    </APIProvider>
  );
};
export default TravelGuide3D;
