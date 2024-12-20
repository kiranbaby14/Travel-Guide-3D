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
  PlaceSelector,
  RouteDisplay3D,
  RouteNarrator,
  TourControls,
} from "./map-3d";
import { Map3DProvider, useMap3D } from "@/context/Map3DContext";
import { RouteProvider, useRoute } from "@/context/RouteContext";
import { Map3DCameraProps } from "@/types";
import { useCameraAnimation } from "@/hooks";
import { INITIAL_VIEW_PROPS } from "@/lib/constants";

const API_KEY =
  globalThis.GOOGLE_MAPS_API_KEY ??
  (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string);

const Map3DExample = () => {
  const placesLibrary = useMapsLibrary("places");
  const { map3DElement } = useMap3D();
  const { isCalculating, routeData } = useRoute();

  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  const [currentPosition, setCurrentPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [isTourStarted, setIsTourStarted] = useState(false);
  const [routeKey, setRouteKey] = useState(0); // Add this for force remount

  const placesService = useMemo(() => {
    if (placesLibrary && map3DElement) {
      return new placesLibrary.PlacesService(
        map3DElement as unknown as HTMLDivElement,
      );
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
    focusOnPOI,
    isAnimating,
    setIsAnimating,
    isPaused,
    stopAnimation,
    togglePause,
    isPoiFocused,
  } = useCameraAnimation(handleCameraChange, {
    onAnimationEnd: () => {
      setIsTourStarted(false);
    },
  });

  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (!ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;
    setViewProps((p) => ({ ...p, center: { lat, lng, altitude: 0 } }));
  }, []);

  const startTourAnimation = useCallback(() => {
    if (!routeData?.overview_path?.[0]) return;

    setCurrentPosition({
      lat: routeData.overview_path[0].lat(),
      lng: routeData.overview_path[0].lng(),
    });

    animateAlongPath(routeData.overview_path, {
      speedKmH: 130,
      cameraHeight: 100,
      cameraDistance: 300,
      tilt: 60,
      smoothing: 3,
    });
  }, [routeData, setCurrentPosition, animateAlongPath]);

  const handleStartTour = () => {
    if (routeData?.overview_path) {
      setIsLoadingPOIs(true);
      setIsTourStarted(true);
      setIsAnimating(true);
    }
  };

  const handleStopTour = () => {
    stopAnimation();
    setIsTourStarted(false);
  };

  return (
    <div className="relative w-full h-full">
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        defaultLabelsDisabled
      >
        <RouteDisplay3D key={routeKey} />
      </Map3D>
      <PlaceSelector isTourActive={isTourStarted} />
      {routeData && !isCalculating && (
        <TourControls
          isAnimating={isAnimating}
          isTourActive={isTourStarted}
          isPaused={isPaused}
          routeData={routeData}
          isPoiFocused={isPoiFocused}
          onStart={handleStartTour}
          onTogglePause={togglePause}
          onStop={handleStopTour}
        />
      )}
      {isLoadingPOIs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md text-center">
            <h3 className="text-xl font-semibold mb-2">Preparing Your Tour</h3>
            <p className="text-gray-600">
              Finding interesting places along your route...
            </p>
            <div className="mt-4 animate-pulse h-2 bg-blue-400 rounded"></div>
          </div>
        </div>
      )}
      {/* Add RouteNarrator when animation is active */}
      {isTourStarted && routeData && placesService && (
        <RouteNarrator
          currentPosition={currentPosition || routeData.overview_path[0]}
          routeData={routeData}
          placesService={placesService}
          onLoadComplete={() => {
            setIsLoadingPOIs(false);
            startTourAnimation();
          }}
          onMountNeeded={() => setRouteKey((prev) => prev + 1)}
          focusOnPOI={focusOnPOI}
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
            <h1
              className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-bold z-50 px-6 py-2 rounded-full
              bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm
              text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400
              hover:from-blue-500 hover:via-purple-500 hover:to-pink-500
              transition-all duration-300 shadow-lg"
            >
              TravelGuide3D
            </h1>
            <Map3DExample />
          </div>
        </RouteProvider>
      </Map3DProvider>
    </APIProvider>
  );
};
export default TravelGuide3D;
