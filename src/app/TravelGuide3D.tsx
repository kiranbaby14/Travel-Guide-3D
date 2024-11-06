"use client";
import React, { useCallback, useMemo, useState } from "react";
import { APIProvider, MapMouseEvent } from "@vis.gl/react-google-maps";
import { MiniMap } from "./minimap";
import {
  Map3D,
  Map3DCameraProps,
  Map3DClickEvent,
  MapControls,
  RouteWithMarkers,
  useCameraAnimation,
  useRouteCalculation,
  useRouteSelection,
} from "./map-3d";
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
  const { calculateRoute, routeData, isCalculating } = useRouteCalculation();
  const { selectedRoute, createCustomRoute } = useRouteSelection({
    onRouteSelect: (route) => {
      // Optionally update camera to focus on route
      // const midpoint = {
      //   lat: route.destination.lat,
      //   lng: route.destination.lng,
      // };
      // setViewProps((prev) => ({
      //   ...prev,
      //   center: { ...midpoint, altitude: prev.center.altitude },
      // }));
    },
  });

  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps((oldProps) => ({ ...oldProps, ...props }));
  }, []);

  const { animateAlongPath, isAnimating, stopAnimation } =
    useCameraAnimation(handleCameraChange);

  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (!ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;
    setViewProps((p) => ({ ...p, center: { lat, lng, altitude: 0 } }));
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

  // Update the handler to use createCustomRoute
  const handleCreateRoute = useCallback(async () => {
    const route = {
      origin: { lat: 40.7144, lng: -74.0208 }, // NY coordinates
      destination: { lat: 40.7233, lng: -73.9989 }, // LA coordinates
      waypoints: [
        { lat: 40.7178, lng: -73.9855 }, // Brooklyn side
      ],
    };

    // Create the route in state
    createCustomRoute(route.origin, route.destination, route.waypoints);

    // Calculate the route once
    const routeData = await calculateRoute({
      origin: route.origin,
      destination: route.destination,
      waypoints: route.waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    if (routeData) {
      // Start the animation using the calculated route data
      animateAlongPath(routeData.overview_path, {
        duration: 10000,
        altitude: 1000,
        tilt: 60,
      });
    }
  }, [createCustomRoute, calculateRoute, animateAlongPath]);

  // Memoize the route display component
  const routeDisplayComponent = useMemo(() => {
    return selectedRoute && routeData ? (
      <RouteWithMarkers
        routeCoordinates={routeData.routeCoordinates}
        origin={selectedRoute.origin}
        destination={selectedRoute.destination}
        waypoints={selectedRoute.waypoints}
        onDestinationMarkerClick={() =>
          console.log("Destination marker clicked!")
        }
        onOriginMarkerClick={() => console.log("Origin marker clicked!")}
      />
    ) : null;
  }, [selectedRoute, routeData]);

  return (
    <div className="relative w-full h-full">
      <Map3D
        {...viewProps}
        onCameraChange={handleCameraChange}
        onClick={handleMap3DClick}
        // defaultLabelsDisabled
      >
        {routeDisplayComponent}
      </Map3D>
      <div className="absolute top-4 right-8 z-10 space-y-2">
        <button
          className="bg-blue-50 px-4 py-2 rounded"
          onClick={handleCreateRoute}
          disabled={isAnimating}
        >
          {isAnimating ? "Touring..." : "Show NY to LA Route"}
        </button>
      </div>
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
