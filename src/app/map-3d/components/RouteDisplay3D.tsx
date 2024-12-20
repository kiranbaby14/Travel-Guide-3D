import React from "react";
import { Marker3D } from "./Marker3D";
import { Polyline3D } from "./Polyline3D";
import { useRoute } from "@/context/RouteContext";

const RouteDisplay3D = () => {
  const { origin, destination, waypoints, routeData } = useRoute();

  return (
    <>
      {origin && (
        <Marker3D
          key={`origin-${origin.lat}-${origin.lng}`}
          position={origin}
          title="Origin"
          altitudeMode="RELATIVE_TO_MESH"
          color="#0099ff"
        />
      )}
      {destination && (
        <Marker3D
          key={`destination-${destination.lat}-${destination.lng}`}
          position={destination}
          title="Destination"
          altitudeMode="RELATIVE_TO_MESH"
          color="red"
        />
      )}
      {waypoints.map((waypoint) => (
        <Marker3D
          key={waypoint.id}
          position={waypoint.location}
          title="Waypoint"
          altitudeMode="RELATIVE_TO_MESH"
          color="green"
        />
      ))}
      {routeData && (
        <Polyline3D
          coordinates={routeData.routeCoordinates}
          strokeColor="rgba(25, 74, 210, 0.75)"
          strokeWidth={10}
          altitudeMode="RELATIVE_TO_GROUND"
        />
      )}
    </>
  );
};

export { RouteDisplay3D };
