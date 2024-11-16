import React, { useEffect, useState, useCallback } from "react";
import { useRoutePointsOfInterest } from "@/hooks";
import { Polygon3D } from "./Polygon3D";
import { Accessibility, Clock, Star } from "lucide-react";
import { RouteData, PointOfInterest } from "@/types";

interface RouteNarratorProps {
  currentPosition: google.maps.LatLngLiteral;
  routeData: RouteData;
  placesService: google.maps.places.PlacesService;
  onLoadComplete: () => void;
  onMountNeeded: () => void;
  focusOnPOI: (target: google.maps.LatLngLiteral, duration: number) => void;
}

const RouteNarrator: React.FC<RouteNarratorProps> = ({
  currentPosition,
  routeData,
  placesService,
  onLoadComplete,
  onMountNeeded,
  focusOnPOI,
}) => {
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const { pointsOfInterest, isLoading } = useRoutePointsOfInterest(
    routeData,
    placesService,
  );

  // Cleanup function to handle component unmount or tour stop
  const cleanup = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAnnouncement("");
    setSelectedPOI(null);
    setLastAnnouncedId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [cleanup]);

  useEffect(() => {
    onMountNeeded();
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && pointsOfInterest.length > 0) {
      onLoadComplete();
    }
  }, [isLoading, pointsOfInterest]);

  const createPolygonCoordinates = (
    center: google.maps.LatLngLiteral,
    radius: number = 30,
  ): google.maps.LatLngAltitudeLiteral[] => {
    const coordinates: google.maps.LatLngAltitudeLiteral[] = [];
    const numPoints = 5;

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
        altitude: 100,
      });
    }

    coordinates.push(coordinates[0]);
    return coordinates;
  };

  const clearAnnouncement = useCallback(() => {
    setAnnouncement("");
    setTimeout(() => {
      setSelectedPOI(null);
    }, 3000);
  }, []);

  const speakAnnouncement = useCallback(
    (message: string) => {
      if ("speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.onend = clearAnnouncement;
        window.speechSynthesis.speak(utterance);
      }
    },
    [clearAnnouncement],
  );

  useEffect(() => {
    if (isLoading || !currentPosition || pointsOfInterest.length === 0) return;

    const nearbyPOI = pointsOfInterest.find((poi) => {
      if (poi.id === lastAnnouncedId) return false;

      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(currentPosition),
        new google.maps.LatLng(poi.location),
      );

      return distance < 200;
    });

    if (nearbyPOI) {
      let message = `Approaching ${nearbyPOI.name}. `;

      if (nearbyPOI.insights.editorialSummary?.text) {
        message += nearbyPOI.insights.editorialSummary.text + " ";
      }

      if (nearbyPOI.insights.regularOpeningHours) {
        message += nearbyPOI.insights.regularOpeningHours.openNow
          ? "Currently open. "
          : "Currently closed. ";
      }

      if (nearbyPOI.insights.rating) {
        message += `Rated ${nearbyPOI.insights.rating} stars. `;
      }

      // Calculate focus duration based on message length + extra time for clearing
      const wordCount = message.split(" ").length;
      const estimatedSpeechDuration = (wordCount / 100) * 60 * 1000; // ~100 words per minute
      const totalFocusDuration = estimatedSpeechDuration + 1000; // Add 2 seconds after speech

      // Focus camera on POI
      focusOnPOI(nearbyPOI.location, totalFocusDuration);

      setAnnouncement(message);
      setLastAnnouncedId(nearbyPOI.id);
      setSelectedPOI(nearbyPOI);

      speakAnnouncement(message);
    }
  }, [
    currentPosition,
    pointsOfInterest,
    isLoading,
    lastAnnouncedId,
    focusOnPOI,
    speakAnnouncement,
  ]);

  return (
    <>
      {pointsOfInterest.map((poi, index) => (
        <Polygon3D
          key={`${poi.id}-${index}`}
          outerCoordinates={createPolygonCoordinates(poi.location)}
          onClick={() => {
            setSelectedPOI(poi);
            const message = `Point of Interest: ${poi.name}`;
            setAnnouncement(message);
            speakAnnouncement(message);
          }}
        />
      ))}

      {/* POI Detail Card */}
      {selectedPOI && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl p-4 max-w-md w-full mx-4 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{selectedPOI.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedPOI.insights.formattedAddress}
              </p>
            </div>
            {selectedPOI.insights.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{selectedPOI.insights.rating}</span>
                <span className="text-sm text-gray-500">
                  ({selectedPOI.insights.userRatingCount})
                </span>
              </div>
            )}
          </div>

          {selectedPOI.insights.editorialSummary && (
            <p className="mt-2 text-sm">
              {selectedPOI.insights.editorialSummary.text}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPOI.insights.regularOpeningHours && (
              <span className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-gray-100 rounded">
                <Clock className="w-4 h-4" />
                {selectedPOI.insights.regularOpeningHours.openNow
                  ? "Open"
                  : "Closed"}
              </span>
            )}

            {selectedPOI.insights.accessibilityOptions
              ?.wheelchairAccessibleEntrance && (
              <span className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-gray-100 rounded">
                <Accessibility className="w-4 h-4" />
                Accessible
              </span>
            )}
          </div>

          {selectedPOI.insights.photos &&
            selectedPOI.insights.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {selectedPOI.insights.photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo.name}
                    alt={`${selectedPOI.name} photo ${index + 1}`}
                    className="w-32 h-32 object-cover rounded"
                  />
                ))}
              </div>
            )}
        </div>
      )}

      {/* Simple announcement for non-selected POIs */}
      {announcement && !selectedPOI && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/75 text-white px-6 py-3 rounded-full">
          <div className="text-lg font-medium">{announcement}</div>
        </div>
      )}
    </>
  );
};

export { RouteNarrator };
