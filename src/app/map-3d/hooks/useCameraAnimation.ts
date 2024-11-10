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
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false); // Add ref to track current pause state
  const lastState = useRef<AnimationState>({
    position: { lat: 0, lng: 0 },
    heading: 0,
    tilt: 0,
  });

  // Add refs to store pause state
  const pauseState = useRef<{
    pauseTime: number;
    startTime: number;
    totalPausedTime: number;
  }>({
    pauseTime: 0,
    startTime: 0,
    totalPausedTime: 0,
  });

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsAnimating(false);
    setIsPaused(false);
    isPausedRef.current = false;
    // Reset pause state
    pauseState.current = {
      pauseTime: 0,
      startTime: 0,
      totalPausedTime: 0,
    };
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((current) => {
      const newPausedState = !current;
      isPausedRef.current = newPausedState; // Update ref immediately

      if (newPausedState) {
        // Pausing - store current time
        pauseState.current.pauseTime = performance.now();
      } else {
        // Resuming - calculate total paused time
        pauseState.current.totalPausedTime +=
          performance.now() - pauseState.current.pauseTime;
      }
      return newPausedState;
    });
  }, []);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  // Your existing helper functions remain the same
  const interpolateAngle = (
    a: number,
    b: number,
    t: number,
    smoothing: number,
  ) => {
    const diff = b - a;
    const adjusted = ((diff + 180) % 360) - 180;
    return a + (adjusted * t) / smoothing;
  };

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

    // First stop any existing animation
    stopAnimation();

    const {
      duration = 10000,
      cameraHeight = 50,
      cameraDistance = 100,
      tilt = 45,
      smoothing = 3,
    } = config;

    pauseState.current.startTime = performance.now();
    pauseState.current.totalPausedTime = 0;
    setIsAnimating(true);

    let lastCarPosition = path[0];
    let lastCameraPosition = path[0];

    const animate = (currentTime: number) => {
      // If paused, keep requesting frames but don't update position
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate progress accounting for paused time
      const elapsed =
        currentTime -
        pauseState.current.startTime -
        pauseState.current.totalPausedTime;
      const progress = Math.min(elapsed / duration, 1);

      const index = Math.max(Math.floor(progress * (path.length - 1)), 0);
      const nextIndex = Math.min(index + 1, path.length - 1);
      const subProgress = (progress * (path.length - 1)) % 1;

      const currentPoint = path[index];
      const nextPoint = path[nextIndex];

      // Rest of your animation logic remains the same
      const targetCarPosition = google.maps.geometry.spherical.interpolate(
        currentPoint,
        nextPoint,
        subProgress,
      );

      const smoothedCarPosition = smoothPosition(
        lastCarPosition,
        targetCarPosition,
        smoothing,
      );
      lastCarPosition = smoothedCarPosition;

      const lookAheadIndex = Math.min(index + 2, path.length - 1);
      const lookAheadPoint = path[lookAheadIndex];
      const targetHeading = google.maps.geometry.spherical.computeHeading(
        smoothedCarPosition,
        lookAheadPoint,
      );

      const currentHeading = interpolateAngle(
        lastState.current.heading,
        targetHeading,
        0.1,
        smoothing,
      );

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
        range: cameraDistance * (1 + turnFactor * 0.2),
        roll: Math.sin(progress * Math.PI * 4) * 2 * turnFactor,
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
        setIsPaused(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return {
    animateAlongPath,
    isAnimating,
    isPaused,
    stopAnimation,
    togglePause,
  };
};
