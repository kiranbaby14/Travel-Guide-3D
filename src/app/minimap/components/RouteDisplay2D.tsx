import { useRoute } from "@/context/RouteContext";
import { Polyline2D } from "./Polyline2D";
import { Marker2D } from "./Marker2D";

const RouteDisplay2D = () => {
  const { routeData, origin, destination, waypoints } = useRoute();

  // Define marker colors
  const markerColors = {
    origin: "text-blue-500",
    waypoint: "text-green-500",
    destination: "text-red-500",
  } as const;

  return (
    <>
      {routeData && routeData.overview_path && (
        <Polyline2D path={routeData.overview_path} />
      )}
      {origin && (
        <Marker2D position={origin} type="origin" color={markerColors.origin} />
      )}
      {waypoints?.map((waypoint, index) => (
        <Marker2D
          key={`waypoint-${index}`}
          position={waypoint.location}
          type="waypoint"
          color={markerColors.waypoint}
        />
      ))}
      {destination && (
        <Marker2D
          position={destination}
          type="destination"
          color={markerColors.destination}
        />
      )}
    </>
  );
};

export { RouteDisplay2D };
