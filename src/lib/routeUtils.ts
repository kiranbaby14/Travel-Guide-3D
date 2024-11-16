// Function to calculate path length
const calculatePathLength = (path: google.maps.LatLng[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += google.maps.geometry.spherical.computeDistanceBetween(
      path[i],
      path[i + 1],
    );
  }
  return totalDistance;
};

// Function to calculate duration based on distance and speed
const calculateDuration = (
  distanceInMeters: number,
  speedKmH: number,
): number => {
  const speedInMetersPerSecond = (speedKmH * 1000) / 3600; // Convert km/h to m/s
  const durationInSeconds = distanceInMeters / speedInMetersPerSecond;
  return durationInSeconds * 1000; // Convert to milliseconds
};

export { calculatePathLength, calculateDuration };
