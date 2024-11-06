import { useCallback, useEffect, useRef, useState } from "react";
import type { Map3DCameraProps } from "../Map3D";

interface AnimationConfig {
  duration?: number;
  altitude?: number;
  tilt?: number;
  heading?: number;
}

export const useCameraAnimation = (
  onCameraChange: (props: Map3DCameraProps) => void,
) => {
  const animationRef = useRef<number>();
  const [isAnimating, setIsAnimating] = useState(false);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  const animateAlongPath = useCallback(
    (path: google.maps.LatLng[], config: AnimationConfig = {}) => {
      const {
        duration = 10000,
        altitude = 1000,
        tilt = 60,
        heading = 0,
      } = config;

      if (path.length < 2) return;
      setIsAnimating(true);

      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Get current position along the path
        const index = Math.floor(progress * (path.length - 1));
        const nextIndex = Math.min(index + 1, path.length - 1);
        const subProgress = (progress * (path.length - 1)) % 1;

        // Interpolate between current and next point
        const currentPoint = path[index];
        const nextPoint = path[nextIndex];

        const lat =
          currentPoint.lat() +
          (nextPoint.lat() - currentPoint.lat()) * subProgress;
        const lng =
          currentPoint.lng() +
          (nextPoint.lng() - currentPoint.lng()) * subProgress;

        // Calculate heading based on current and next point
        const currentHeading = google.maps.geometry.spherical.computeHeading(
          currentPoint,
          nextPoint,
        );

        // Calculate dynamic altitude based on distance between points
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          currentPoint,
          nextPoint,
        );
        const dynamicAltitude = Math.min(
          altitude,
          Math.max(500, distance * 0.5),
        );

        // Add some variation to tilt based on progress
        const dynamicTilt = tilt + Math.sin(progress * Math.PI * 2) * 5;

        onCameraChange({
          center: { lat, lng, altitude: dynamicAltitude },
          heading: currentHeading,
          tilt: dynamicTilt,
          range: dynamicAltitude,
          roll: 0,
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [onCameraChange],
  );

  return {
    animateAlongPath,
    isAnimating,
    stopAnimation,
  };
};
