import { useEffect, useState } from "react";
import { calculatePathLength } from "@/lib/routeUtils";
import { PlaceInsights, PointOfInterest, RouteData } from "@/types";

// Constants for distance parameters
const DISTANCES = {
  EXCLUSION_FROM_ENDS: 500, // meters from start/end points
  SAMPLE_INTERVAL: 600, // meters between sampling points
  SEARCH_RADIUS: 250, // meters for nearby search
  FILTER_RADIUS: 200, // meters for filtering POIs
  MIN_POI_SPACING: 600, // minimum meters between POIs
} as const;

interface POIScore {
  point: PointOfInterest;
  score: number;
}

const samplePathPoints = (
  coordinates: google.maps.LatLngLiteral[],
  intervalMeters: number = DISTANCES.SAMPLE_INTERVAL,
  exclusionDistanceFromEnds: number = DISTANCES.EXCLUSION_FROM_ENDS,
): google.maps.LatLngLiteral[] => {
  const sampledPoints: google.maps.LatLngLiteral[] = [];
  let distanceAccumulator = 0;
  const path = coordinates.map((coord) => new google.maps.LatLng(coord));
  const totalRouteDistance = calculatePathLength(path);

  // Track last added point for minimum spacing
  let lastAddedPoint: google.maps.LatLngLiteral | null = null;

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

      // Check if point is within valid range and maintains minimum spacing
      const isValidDistance =
        distanceAlongRoute > exclusionDistanceFromEnds &&
        distanceAlongRoute < totalRouteDistance - exclusionDistanceFromEnds;

      const maintainsMinSpacing =
        !lastAddedPoint ||
        google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(lastAddedPoint),
          new google.maps.LatLng(interpolated),
        ) >= DISTANCES.MIN_POI_SPACING;

      if (isValidDistance && maintainsMinSpacing) {
        sampledPoints.push(interpolated);
        lastAddedPoint = interpolated;
      }

      distanceAccumulator += intervalMeters;
    }

    distanceAccumulator -= segmentDistance;
  }

  return sampledPoints;
};

const getPlaceInsights = async (
  placesService: google.maps.places.PlacesService,
  placeId: string,
): Promise<PlaceInsights> => {
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
};

const findPlacesNearPoint = async (
  placesService: google.maps.places.PlacesService,
  point: google.maps.LatLngLiteral,
  distanceAlongRoute: number,
): Promise<PointOfInterest[]> => {
  return new Promise<PointOfInterest[]>((resolve) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(point),
      radius: DISTANCES.SEARCH_RADIUS,
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

              // Only include POIs within the filter radius
              if (distanceFromPoint <= DISTANCES.FILTER_RADIUS) {
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
};

const calculatePOIScore = (poi: PointOfInterest): number => {
  // Weight factors for scoring
  const WEIGHTS = {
    RATING: 2.0, // Prioritize higher-rated places
    DISTANCE_FROM_ROUTE: -0.5, // Prefer closer places
    USER_RATINGS: 0.3, // Consider number of ratings
    EDITORIAL_SUMMARY: 0.5, // Bonus for places with descriptions
  };

  let score = 0;

  // Base rating score (0-5 scale)
  score += (poi.rating || 0) * WEIGHTS.RATING;

  // Distance penalty (0-300m scale, inverted so closer is better)
  score +=
    ((DISTANCES.FILTER_RADIUS - (poi.distanceFromRoute || 0)) /
      DISTANCES.FILTER_RADIUS) *
    WEIGHTS.DISTANCE_FROM_ROUTE;

  // Number of ratings bonus (log scale to prevent domination by very popular places)
  if (poi.insights?.userRatingCount) {
    score += Math.log10(poi.insights.userRatingCount) * WEIGHTS.USER_RATINGS;
  }

  // Bonus for places with editorial descriptions
  if (poi.insights?.editorialSummary?.text) {
    score += WEIGHTS.EDITORIAL_SUMMARY;
  }

  return score;
};

const selectSpacedPoints = (
  points: PointOfInterest[],
  minDistanceMeters: number = DISTANCES.MIN_POI_SPACING,
): PointOfInterest[] => {
  // Calculate scores for all points
  const scoredPoints: POIScore[] = points.map((point) => ({
    point,
    score: calculatePOIScore(point),
  }));

  // Sort by score descending
  const sortedPoints = scoredPoints.sort((a, b) => b.score - a.score);

  const selectedPoints: PointOfInterest[] = [];

  for (const { point } of sortedPoints) {
    // Check if this point maintains minimum distance from all selected points
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

  // Return points sorted by distance along route
  return selectedPoints.sort(
    (a, b) => a.distanceAlongRoute - b.distanceAlongRoute,
  );
};

const useRoutePointsOfInterest = (
  routeData: RouteData | null,
  placesService: google.maps.places.PlacesService | null,
  minDistanceBetweenPOIs: number = DISTANCES.MIN_POI_SPACING,
  exclusionDistanceFromEnds: number = DISTANCES.EXCLUSION_FROM_ENDS,
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
          DISTANCES.SAMPLE_INTERVAL,
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

export { useRoutePointsOfInterest };
