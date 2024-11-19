import { useEffect, useState } from "react";
import { RouteData, PlaceInsights, PointOfInterest } from "@/types";
import { calculatePathLength } from "@/lib/routeUtils";

// lib/routeUtils.ts
export function samplePathPoints(
  coordinates: google.maps.LatLngLiteral[],
  intervalMeters: number,
  exclusionDistanceFromEnds: number = 500, // Skip points within 500 meters of start/end
): google.maps.LatLngLiteral[] {
  const sampledPoints: google.maps.LatLngLiteral[] = [];
  let distanceAccumulator = 0;
  // Convert to LatLng array for helper function
  const path = coordinates.map((coord) => new google.maps.LatLng(coord));
  const totalRouteDistance = calculatePathLength(path);

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

      const distanceAlongRoute =
        distanceAccumulator +
        google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(coordinates[0]),
          new google.maps.LatLng(interpolated),
        );

      // Skip points near start and end
      if (
        distanceAlongRoute > exclusionDistanceFromEnds &&
        distanceAlongRoute < totalRouteDistance - exclusionDistanceFromEnds
      ) {
        sampledPoints.push(interpolated);
      }

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
  return new Promise<PointOfInterest[]>((resolve) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(point),
      radius: 400,
      type: "tourist_attraction",
      rankBy: google.maps.places.RankBy.PROMINENCE,
    };

    placesService.nearbySearch(request, async (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        try {
          const poisWithInsights = await Promise.all(
            results.map(async (place) => {
              const placeLocation = {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              };

              const distanceFromPoint =
                google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(point),
                  new google.maps.LatLng(placeLocation),
                );

              if (distanceFromPoint <= 300) {
                const insights = await getPlaceInsights(
                  placesService,
                  place.place_id!,
                );

                return {
                  id: place.place_id!,
                  name: place.name!,
                  location: placeLocation,
                  distanceAlongRoute,
                  distanceFromRoute: distanceFromPoint,
                  rating: place.rating,
                  placeType: place.types?.[0] || "tourist_attraction",
                  insights,
                };
              }
              return null;
            }),
          );

          resolve(
            poisWithInsights.filter(
              (poi): poi is NonNullable<typeof poi> => poi !== null,
            ),
          );
        } catch (error) {
          console.error("Error getting place insights:", error);
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  });
}

export function selectSpacedPoints(
  points: PointOfInterest[],
  minDistanceMeters: number = 300,
): PointOfInterest[] {
  // Sort by rating and distance from route to prioritize better-rated places
  const sortedPoints = [...points].sort((a, b) => {
    // Prioritize rating first
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (Math.abs(ratingDiff) > 0.5) {
      // Only use rating if difference is significant
      return ratingDiff;
    }
    // Then consider distance from route
    return (a.distanceFromRoute || 0) - (b.distanceFromRoute || 0);
  });

  const selectedPoints: PointOfInterest[] = [];

  for (const point of sortedPoints) {
    // Check if this point is far enough from all selected points
    const isFarEnough = selectedPoints.every((selectedPoint) => {
      const distanceBetweenPoints = Math.abs(
        point.distanceAlongRoute - selectedPoint.distanceAlongRoute,
      );
      return distanceBetweenPoints >= minDistanceMeters;
    });

    if (isFarEnough) {
      selectedPoints.push(point);
    }
  }

  return selectedPoints.sort(
    (a, b) => a.distanceAlongRoute - b.distanceAlongRoute,
  );
}

export const useRoutePointsOfInterest = (
  routeData: RouteData | null,
  placesService: google.maps.places.PlacesService | null,
  minDistanceBetweenPOIs: number = 500, // Allow customizing the minimum distance
  exclusionDistanceFromEnds: number = 200,
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
        const sampledPoints = samplePathPoints(
          routeData.routeCoordinates,
          600,
          exclusionDistanceFromEnds,
        );
        let totalDistance = 0;

        for (const [index, point] of sampledPoints.entries()) {
          const nearbyPlaces = await findPlacesNearPoint(
            placesService,
            point,
            totalDistance,
          );

          points.push(...nearbyPlaces);

          if (index < sampledPoints.length - 1) {
            const nextPoint = sampledPoints[index + 1];
            totalDistance +=
              google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(point),
                new google.maps.LatLng(nextPoint),
              );
          }
        }

        // Use the new spacing function instead of simple deduplication
        const spacedPoints = selectSpacedPoints(points, minDistanceBetweenPOIs);

        setPointsOfInterest(spacedPoints);
      } catch (error) {
        console.error("Error finding points of interest:", error);
        setError("Failed to load points of interest");
      } finally {
        setIsLoading(false);
      }
    };

    findPointsOfInterest();
  }, [routeData]);

  return { pointsOfInterest, isLoading, error };
};
