import { useEffect, useState } from "react";
import { RouteData, PlaceInsights, PointOfInterest } from "@/types";

// lib/routeUtils.ts
export function samplePathPoints(
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

export async function getPlaceInsights(
  placesService: google.maps.places.PlacesService,
  placeId: string,
): Promise<PlaceInsights> {
  try {
    const Place = google.maps.places.Place;
    const place = new Place({ id: placeId });

    // Use correct camelCase field names that match the Place class properties
    const { place: details } = await place.fetchFields({
      fields: [
        "formattedAddress",
        "editorialSummary",
        "businessStatus",
        "priceLevel",
        "rating",
        "userRatingCount",
        "photos",
        "regularOpeningHours",
        "accessibilityOptions",
      ],
    });

    return {
      formattedAddress: details.formattedAddress || "",
      regularOpeningHours: details.regularOpeningHours
        ? {
            openNow: await details.isOpen(),
            periods: details.regularOpeningHours.periods || [],
            weekdayDescriptions:
              details.regularOpeningHours.weekdayDescriptions || [],
          }
        : undefined,
      editorialSummary: details.editorialSummary
        ? {
            text: details.editorialSummary,
          }
        : undefined,
      businessStatus: details.businessStatus || "",
      priceLevel: details.priceLevel,
      rating: details.rating,
      userRatingCount: details.userRatingCount,
      photos: details.photos?.map((photo) => ({
        name: photo.getURI({ maxWidth: 400 }),
      })),
      accessibilityOptions: {
        wheelchairAccessibleEntrance:
          details.accessibilityOptions?.hasWheelchairAccessibleEntrance,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get place insights: ${error}`);
  }
}

export async function findPlacesNearPoint(
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
      new Promise<PointOfInterest[]>(async (resolve) => {
        const request: google.maps.places.FindPlaceFromQueryRequest = {
          query: keyword,
          fields: ["place_id", "name", "geometry"],
          locationBias: point,
        };

        placesService.findPlaceFromQuery(request, async (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            try {
              const poisWithInsights = await Promise.all(
                results.map(async (place) => {
                  const insights = await getPlaceInsights(
                    placesService,
                    place.place_id!,
                  );
                  return {
                    id: place.place_id!,
                    name: place.name!,
                    location: {
                      lat: place.geometry!.location!.lat(),
                      lng: place.geometry!.location!.lng(),
                    },
                    distanceAlongRoute,
                    insights,
                  };
                }),
              );
              resolve(poisWithInsights);
            } catch (error) {
              console.error("Error getting place insights:", error);
              resolve([]);
            }
          } else {
            resolve([]);
          }
        });
      }),
  );

  const results = await Promise.all(searchPromises);
  return results.flat();
}

export function deduplicatePoints(
  points: PointOfInterest[],
): PointOfInterest[] {
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

export const useRoutePointsOfInterest = (
  routeData: RouteData | null,
  placesService: google.maps.places.PlacesService | null,
) => {
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeData?.routeCoordinates || !placesService) return;

    const findPointsOfInterest = async () => {
      setIsLoading(true);
      setError(null);
      const points: PointOfInterest[] = [];

      try {
        const sampledPoints = samplePathPoints(routeData.routeCoordinates, 200);
        let totalDistance = 0;

        for (const point of sampledPoints) {
          const nearbyPlaces = await findPlacesNearPoint(
            placesService,
            point,
            totalDistance,
          );
          points.push(...nearbyPlaces);

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
        setError("Failed to load points of interest");
      } finally {
        setIsLoading(false);
      }
    };

    findPointsOfInterest();
  }, []);

  return { pointsOfInterest, isLoading, error };
};
