import { useEffect, useState } from "react";

interface RouteData {
  bounds: google.maps.LatLngBounds;
  distance: string;
  duration: string;
  overview_path: google.maps.LatLng[];
  routeCoordinates: google.maps.LatLngLiteral[];
}

interface PointOfInterest {
  id: string;
  name: string;
  location: google.maps.LatLngLiteral;
  distanceAlongRoute: number;
}

export const useRoutePointsOfInterest = (
  routeData: RouteData | null,
  placesService: google.maps.places.PlacesService | null,
) => {
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!routeData?.routeCoordinates || !placesService) return;

    const findPointsOfInterest = async () => {
      setIsLoading(true);
      const points: PointOfInterest[] = [];

      try {
        // Use routeCoordinates directly for sampling
        const sampledPoints = samplePathPoints(routeData.routeCoordinates, 200);
        let totalDistance = 0;

        // Search for places near each sampled point
        for (const point of sampledPoints) {
          const nearbyPlaces = await findPlacesNearPoint(
            placesService,
            point,
            totalDistance,
          );
          points.push(...nearbyPlaces);

          // Calculate distance to next point if available
          if (sampledPoints.indexOf(point) < sampledPoints.length - 1) {
            const nextPoint = sampledPoints[sampledPoints.indexOf(point) + 1];
            totalDistance +=
              google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(point),
                new google.maps.LatLng(nextPoint),
              );
          }
        }

        const uniquePoints = deduplicatePoints(points);
        setPointsOfInterest(uniquePoints);
      } catch (error) {
        console.error("Error finding points of interest:", error);
      } finally {
        setIsLoading(false);
      }
    };

    findPointsOfInterest();
  }, [routeData, placesService]);

  return { pointsOfInterest, isLoading };
};

function samplePathPoints(
  coordinates: google.maps.LatLngLiteral[],
  intervalMeters: number,
): google.maps.LatLngLiteral[] {
  const sampledPoints: google.maps.LatLngLiteral[] = [];
  let distanceAccumulator = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    const segmentDistance =
      google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(start),
        new google.maps.LatLng(end),
      );

    while (distanceAccumulator < segmentDistance) {
      const fraction = distanceAccumulator / segmentDistance;
      const interpolated = google.maps.geometry.spherical
        .interpolate(
          new google.maps.LatLng(start),
          new google.maps.LatLng(end),
          fraction,
        )
        .toJSON();

      sampledPoints.push(interpolated);
      distanceAccumulator += intervalMeters;
    }

    distanceAccumulator -= segmentDistance;
  }

  return sampledPoints;
}

async function findPlacesNearPoint(
  placesService: google.maps.places.PlacesService,
  point: google.maps.LatLngLiteral,
  distanceAlongRoute: number,
): Promise<PointOfInterest[]> {
  const landmarkKeywords = [
    "landmark",
    "monument",
    "museum",
    "park",
    "stadium",
    "mall",
    "tourist attraction",
  ];

  const searchPromises = landmarkKeywords.map(
    (keyword) =>
      new Promise<PointOfInterest[]>((resolve) => {
        const request: google.maps.places.FindPlaceFromQueryRequest = {
          query: keyword,
          fields: ["place_id", "name", "geometry"],
          locationBias: point, // Directly pass the LatLngLiteral
        };

        placesService.findPlaceFromQuery(request, (results, status) => {
          console.log(results);

          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const pois = results.map((place) => ({
              id: place.place_id!,
              name: place.name!,
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
              distanceAlongRoute,
            }));
            resolve(pois);
          } else {
            resolve([]);
          }
        });
      }),
  );

  const results = await Promise.all(searchPromises);
  return results.flat();
}

function deduplicatePoints(points: PointOfInterest[]): PointOfInterest[] {
  const uniquePoints = new Map<string, PointOfInterest>();
  points.forEach((point) => {
    if (!uniquePoints.has(point.id)) {
      uniquePoints.set(point.id, point);
    }
  });

  return Array.from(uniquePoints.values()).sort(
    (a, b) => a.distanceAlongRoute - b.distanceAlongRoute,
  );
}
