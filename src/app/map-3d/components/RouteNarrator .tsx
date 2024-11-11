import React, { useEffect, useState } from "react";
import { useRoutePointsOfInterest } from "@/hooks";

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

      // Optional: Text-to-speech
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentPosition, pointsOfInterest, isLoading, lastAnnouncedId]);

  if (!announcement && !isLoading) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/75 text-white px-6 py-3 rounded-full">
      <div className="text-lg font-medium">
        {isLoading ? "Loading points of interest..." : announcement}
      </div>
    </div>
  );
};

export { RouteNarrator };
