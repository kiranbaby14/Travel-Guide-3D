import { useCallback, useEffect, useRef, useState } from "react";
import type { Map3DCameraProps } from "../Map3D";

interface AnimationConfig {
  duration?: number;
  cameraHeight?: number;
  cameraDistance?: number;
  tilt?: number;
  smoothing?: number;
}

interface AnimationState {
  position: google.maps.LatLngLiteral;
  heading: number;
  tilt: number;
}

export const useCameraAnimation = (
  onCameraChange: (props: Map3DCameraProps) => void,
) => {
  const animationRef = useRef<number>();
  const [isAnimating, setIsAnimating] = useState(false);
  const lastState = useRef<AnimationState>({
    position: { lat: 0, lng: 0 },
    heading: 0,
    tilt: 0,
  });

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

  const interpolateAngle = (a: number, b: number, t: number) => {
    const diff = b - a;
    const adjusted = ((diff + 180) % 360) - 180;
    return a + adjusted * t;
  };

  const lerp = (start: number, end: number, t: number, smoothing: number) => {
    const smoothT = 1 - Math.pow(1 - t, smoothing);
    return start + (end - start) * smoothT;
  };

  const animateAlongPath = (
    path: google.maps.LatLng[],
    config: AnimationConfig = {},
  ) => {
    if (path.length < 2) return;

    const {
      duration = 10000,
      cameraHeight = 50,
      cameraDistance = 100,
      tilt = 45,
      smoothing = 3,
    } = config;

    setIsAnimating(true);
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const index = Math.floor(progress * (path.length - 1));
      const nextIndex = Math.min(index + 1, path.length - 1);
      const subProgress = (progress * (path.length - 1)) % 1;

      // Use Google Maps geometry library for calculations
      const currentPoint = path[index];
      const nextPoint = path[nextIndex];

      // Calculate car position using spherical interpolation
      const carPosition = google.maps.geometry.spherical.interpolate(
        currentPoint,
        nextPoint,
        subProgress,
      );

      // Calculate heading using spherical geometry
      const heading = google.maps.geometry.spherical.computeHeading(
        currentPoint,
        nextPoint,
      );

      // Smooth heading transitions
      const currentHeading = interpolateAngle(
        lastState.current.heading,
        heading,
        0.1,
      );

      // Calculate camera offset using spherical geometry
      const cameraOffset = google.maps.geometry.spherical.computeOffset(
        carPosition,
        -cameraDistance, // Negative distance to position camera behind the car
        currentHeading,
      );

      const dynamicTilt = tilt + Math.sin(progress * Math.PI * 8) * 2;

      onCameraChange({
        center: {
          lat: cameraOffset.lat(),
          lng: cameraOffset.lng(),
          altitude: cameraHeight,
        },
        heading: currentHeading,
        tilt: dynamicTilt,
        range: cameraDistance,
        roll: Math.sin(progress * Math.PI * 4) * 2,
      });

      lastState.current = {
        position: { lat: carPosition.lat(), lng: carPosition.lng() },
        heading: currentHeading,
        tilt: dynamicTilt,
      };

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return {
    animateAlongPath,
    isAnimating,
    stopAnimation,
  };
};
