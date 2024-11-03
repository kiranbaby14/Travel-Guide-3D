import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

import "./viewCenterMarker.css";

type ViewCenterMarkerProps = { position: google.maps.LatLngAltitudeLiteral };
export const ViewCenterMarker = ({ position }: ViewCenterMarkerProps) => (
  <AdvancedMarker position={position} className={"view-center-marker"}>
    <div className={"circle"} />
  </AdvancedMarker>
);
