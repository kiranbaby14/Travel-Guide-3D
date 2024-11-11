import React, { useEffect, useState } from "react";
import { useRoutePointsOfInterest } from "@/hooks";
import { Polygon3D } from "./Polygon3D";

type RouteData = {
  routeCoordinates: google.maps.LatLngLiteral[];
  overview_path: google.maps.LatLng[];
  bounds: google.maps.LatLngBounds;
  distance: string;
  duration: string;
};

interface RouteNarratorProps {
  currentPosition: google.maps.LatLngLiteral;
  routeData: RouteData;
  placesService: google.maps.places.PlacesService;
}

const RouteNarrator: React.FC<RouteNarratorProps> = ({
  currentPosition,
  routeData,
  placesService,
}) => {
  const { pointsOfInterest, isLoading } = useRoutePointsOfInterest(
    routeData,
    placesService,
  );
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  // Create circular polygon coordinates for each POI
  const createCircleCoordinates = (
    center: google.maps.LatLngLiteral,
    radius: number = 50,
  ): google.maps.LatLngAltitudeLiteral[] => {
    const coordinates: google.maps.LatLngAltitudeLiteral[] = [];
    const numPoints = 5; // Number of points to create circle

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 360;
      const lat =
        center.lat + (radius / 111320) * Math.cos((angle * Math.PI) / 180);
      const lng =
        center.lng +
        (radius / (111320 * Math.cos((center.lat * Math.PI) / 180))) *
          Math.sin((angle * Math.PI) / 180);
      coordinates.push({
        lat,
        lng,
        altitude: 100, // Height above ground in meters
      });
    }

    // Close the circle
    coordinates.push(coordinates[0]);
    return coordinates;
  };

  useEffect(() => {
    if (isLoading || !currentPosition || pointsOfInterest.length === 0) return;

    // Find the nearest unannounced POI within 200 meters
    const nearbyPOI = pointsOfInterest.find((poi) => {
      if (poi.id === lastAnnouncedId) return false;

      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(currentPosition),
        new google.maps.LatLng(poi.location),
      );

      return distance < 200;
    });

    if (nearbyPOI) {
      const message = `Passing by: ${nearbyPOI.name}`;
      setAnnouncement(message);
      setLastAnnouncedId(nearbyPOI.id);

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentPosition, pointsOfInterest, isLoading, lastAnnouncedId]);

  return (
    <>
      {/* Render polygons for each POI */}
      {pointsOfInterest.map((poi) => {
        const isNearby = poi.id === lastAnnouncedId;
        return (
          <Polygon3D
            key={poi.id}
            outerCoordinates={createCircleCoordinates(poi.location)}
            onClick={() => {
              setAnnouncement(`Selected: ${poi.name}`);
            }}
          />
        );
      })}

      {/* Announcement UI */}
      {(announcement || isLoading) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/75 text-white px-6 py-3 rounded-full">
          <div className="text-lg font-medium">
            {isLoading ? "Loading points of interest..." : announcement}
          </div>
        </div>
      )}
    </>
  );
};

export { RouteNarrator };
