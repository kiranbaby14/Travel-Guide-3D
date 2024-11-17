import React, { useMemo } from "react";
import { Map, MapMouseEvent, useMap } from "@vis.gl/react-google-maps";
import { useDebouncedEffect } from "../../hooks/utilityHooks";
import { estimateCameraPosition } from "@/lib/minimapUtils";
import { CameraPositionMarker } from "./CameraPositionMarker";
import { ViewCenterMarker } from "./ViewCenterMarker";
import { Map3DCameraProps } from "@/types";
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
