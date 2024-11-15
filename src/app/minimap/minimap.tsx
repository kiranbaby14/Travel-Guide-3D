import React, { useMemo } from "react";
import { Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";

import { useDebouncedEffect } from "../../hooks/utilityHooks";
import { estimateCameraPosition } from "./estimateCameraPosition";
import { CameraPositionMarker } from "./CameraPositionMarker";
import { ViewCenterMarker } from "./ViewCenterMarker";

import type { Map3DCameraProps } from "../map-3d";
import { useRoute } from "@/context/RouteContext";
import { RouteDisplay2D } from "./components";

interface MiniMapProps {
  camera3dProps: Map3DCameraProps;
  onMapClick?: (ev: MapMouseEvent) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ camera3dProps, onMapClick }) => {
  const minimap = useMap("minimap");
  const { routeData } = useRoute();

  const cameraPosition = useMemo(
    () => estimateCameraPosition(camera3dProps),
    [camera3dProps],
  );

  const routePolyline = useMemo(() => {
    if (!routeData?.overview_path) return null;

    return new google.maps.Polyline({
      path: routeData.overview_path,
      geodesic: true,
      strokeColor: "#0062ff",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  }, [routeData]);

  useDebouncedEffect(
    () => {
      if (!minimap) return;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(camera3dProps.center);
      bounds.extend(cameraPosition);

      const maxZoom = Math.max(
        1,
        Math.round(24 - Math.log2(camera3dProps.range)),
      );

      minimap.fitBounds(bounds, 120);
      minimap.setZoom(maxZoom);

      // Attach polyline to map
      if (routePolyline) {
        routePolyline.setMap(minimap);
      }

      // Cleanup function
      return () => {
        if (routePolyline) {
          routePolyline.setMap(null);
        }
      };
    },
    200,
    [minimap, camera3dProps.center, camera3dProps.range, cameraPosition],
  );

  return (
    <Map
      id={"minimap"}
      className={"minimap"}
      mapId={process.env.NEXT_PUBLIC_MAP_ID}
      defaultCenter={camera3dProps.center}
      defaultZoom={10}
      onClick={onMapClick}
      disableDefaultUI
      clickableIcons={false}
    >
      {/* <ViewCenterMarker position={camera3dProps.center}></ViewCenterMarker> */}
      <CameraPositionMarker
        position={cameraPosition}
        heading={camera3dProps.heading}
      />
      <RouteDisplay2D />
    </Map>
  );
};

export { MiniMap };
