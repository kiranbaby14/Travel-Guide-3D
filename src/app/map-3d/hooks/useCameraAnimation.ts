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

  // Enhanced angle interpolation with smoothing
  const interpolateAngle = (
    a: number,
    b: number,
    t: number,
    smoothing: number,
  ) => {
    const diff = b - a;
    const adjusted = ((diff + 180) % 360) - 180;
    // Apply smoothing using exponential moving average
    return a + (adjusted * t) / smoothing;
  };

  // New helper function for position smoothing
  const smoothPosition = (
    current: google.maps.LatLng,
    target: google.maps.LatLng,
    smoothing: number,
  ): google.maps.LatLng => {
    const lat = current.lat() + (target.lat() - current.lat()) / smoothing;
    const lng = current.lng() + (target.lng() - current.lng()) / smoothing;
    return new google.maps.LatLng(lat, lng);
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
    let lastCarPosition = path[0];
    let lastCameraPosition = path[0];

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const index = Math.floor(progress * (path.length - 1));
      const nextIndex = Math.min(index + 1, path.length - 1);
      const subProgress = (progress * (path.length - 1)) % 1;

      const currentPoint = path[index];
      const nextPoint = path[nextIndex];

      // Calculate target car position
      const targetCarPosition = google.maps.geometry.spherical.interpolate(
        currentPoint,
        nextPoint,
        subProgress,
      );

      // Apply smoothing to car position
      const smoothedCarPosition = smoothPosition(
        lastCarPosition,
        targetCarPosition,
        smoothing,
      );
      lastCarPosition = smoothedCarPosition;

      // Calculate heading with look-ahead for smoother turns
      const lookAheadIndex = Math.min(index + 2, path.length - 1);
      const lookAheadPoint = path[lookAheadIndex];
      const targetHeading = google.maps.geometry.spherical.computeHeading(
        smoothedCarPosition,
        lookAheadPoint,
      );

      // Smooth heading transitions
      const currentHeading = interpolateAngle(
        lastState.current.heading,
        targetHeading,
        0.1,
        smoothing,
      );

      // Calculate and smooth camera position
      const targetCameraOffset = google.maps.geometry.spherical.computeOffset(
        smoothedCarPosition,
        -cameraDistance,
        currentHeading,
      );

      const smoothedCameraPosition = smoothPosition(
        lastCameraPosition,
        targetCameraOffset,
        smoothing,
      );
      lastCameraPosition = smoothedCameraPosition;

      // Add subtle tilt variation based on speed and turning
      const speedFactor = Math.min(
        google.maps.geometry.spherical.computeDistanceBetween(
          currentPoint,
          nextPoint,
        ) / 100,
        1,
      );
      const turnFactor = Math.abs(
        (targetHeading - lastState.current.heading) / 180,
      );
      const dynamicTilt =
        tilt +
        Math.sin(progress * Math.PI * 8) * 2 * speedFactor +
        turnFactor * 5;

      onCameraChange({
        center: {
          lat: smoothedCameraPosition.lat(),
          lng: smoothedCameraPosition.lng(),
          altitude: cameraHeight,
        },
        heading: currentHeading,
        tilt: dynamicTilt,
        range: cameraDistance * (1 + turnFactor * 0.2), // Adjust distance in turns
        roll: Math.sin(progress * Math.PI * 4) * 2 * turnFactor, // More roll in turns
      });

      lastState.current = {
        position: {
          lat: smoothedCarPosition.lat(),
          lng: smoothedCarPosition.lng(),
        },
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
