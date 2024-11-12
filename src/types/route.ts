interface RouteData {
  bounds: google.maps.LatLngBounds;
  distance: string;
  duration: string;
  overview_path: google.maps.LatLng[];
  routeCoordinates: google.maps.LatLngLiteral[];
}

interface PlaceInsights {
  formattedAddress: string;
  regularOpeningHours?: {
    openNow: boolean;
    periods: {
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close: {
        day: number;
        hour: number;
        minute: number;
      };
    }[];
    weekdayDescriptions: string[];
  };
  editorialSummary?: {
    text: string;
  };
  businessStatus: string;
  priceLevel?: google.maps.places.PriceLevel | null;
  rating?: number | null;
  userRatingCount?: number | null;
  photos?: {
    name: string;
  }[];
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean | null;
  };
}

interface PointOfInterest {
  id: string;
  name: string;
  location: google.maps.LatLngLiteral;
  distanceAlongRoute: number;
  insights: PlaceInsights;
}

export type { RouteData, PlaceInsights, PointOfInterest };
