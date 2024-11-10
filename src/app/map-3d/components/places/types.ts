type Location = {
  lat: number;
  lng: number;
};

type Waypoint = {
  id: string;
  location: Location;
};

export type { Location, Waypoint };
