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
  range: number;
}

interface CameraAnimationOptions {
  onAnimationEnd?: () => void;
}

export const useCameraAnimation = (
  onCameraChange: (props: Map3DCameraProps) => void,
  options?: CameraAnimationOptions,
) => {
  const animationRef = useRef<number>();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const lastState = useRef<AnimationState>({
    position: { lat: 0, lng: 0 },
    heading: 0,
    tilt: 0,
    range: 0,
  });

  const poiFocusRef = useRef<{
    isActive: boolean;
    phase: "transitioning-to" | "focused" | "transitioning-from" | null;
    target: google.maps.LatLngLiteral | null;
    originalState: AnimationState | null;
    startTime: number;
    transitionDuration: number;
    focusDuration: number;
  }>({
    isActive: false,
    phase: null,
    target: null,
    originalState: null,
    startTime: 0,
    transitionDuration: 1500,
    focusDuration: 8000,
  });

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
    poiFocusRef.current = {
      isActive: false,
      phase: null,
      target: null,
      originalState: null,
      startTime: 0,
      transitionDuration: 1500,
      focusDuration: 8000,
    };
    pauseState.current = {
      pauseTime: 0,
      startTime: 0,
      totalPausedTime: 0,
    };
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((current) => {
      const newPausedState = !current;
      isPausedRef.current = newPausedState;

      if (newPausedState) {
        pauseState.current.pauseTime = performance.now();
      } else {
        pauseState.current.totalPausedTime +=
          performance.now() - pauseState.current.pauseTime;
      }
      return newPausedState;
    });
  }, []);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  const interpolateAngle = (a: number, b: number, t: number) => {
    const diff = b - a;
    const adjusted = ((diff + 180) % 360) - 180;
    return a + adjusted * t;
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

  const smoothValue = (
    current: number,
    target: number,
    smoothing: number,
  ): number => {
    return current + (target - current) / smoothing;
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const focusOnPOI = useCallback(
    (target: google.maps.LatLngLiteral, focusDuration: number = 8000) => {
      if (!isAnimating) return;

      poiFocusRef.current = {
        isActive: true,
        phase: "transitioning-to",
        target,
        originalState: { ...lastState.current },
        startTime: performance.now(),
        transitionDuration: 1500,
        focusDuration,
      };
    },
    [isAnimating],
  );

  const animateAlongPath = (
    path: google.maps.LatLng[],
    config: AnimationConfig = {},
  ) => {
    if (path.length < 2) return;

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
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (poiFocusRef.current.isActive && poiFocusRef.current.target) {
        const focusState = poiFocusRef.current;
        const phaseStartTime = focusState.startTime;
        const elapsed = currentTime - phaseStartTime;

        if (focusState.phase === "transitioning-to") {
          const progress = Math.min(elapsed / focusState.transitionDuration, 1);
          const easedProgress = easeInOutCubic(progress);

          if (progress < 1) {
            const targetHeading = google.maps.geometry.spherical.computeHeading(
              new google.maps.LatLng(lastCarPosition),
              new google.maps.LatLng(focusState.target),
            );

            const interpolatedHeading = interpolateAngle(
              focusState.originalState!.heading,
              targetHeading,
              easedProgress,
            );

            const smoothedHeading = smoothValue(
              lastState.current.heading,
              interpolatedHeading,
              smoothing,
            );

            const targetTilt =
              focusState.originalState!.tilt +
              (60 - focusState.originalState!.tilt) * easedProgress;
            const smoothedTilt = smoothValue(
              lastState.current.tilt,
              targetTilt,
              smoothing,
            );

            const targetRange =
              focusState.originalState!.range +
              (200 - focusState.originalState!.range) * easedProgress;
            const smoothedRange = smoothValue(
              lastState.current.range,
              targetRange,
              smoothing,
            );

            onCameraChange({
              center: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
                altitude: cameraHeight,
              },
              heading: smoothedHeading,
              tilt: smoothedTilt,
              range: smoothedRange,
              roll: 0,
            });

            lastState.current = {
              position: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
              },
              heading: smoothedHeading,
              tilt: smoothedTilt,
              range: smoothedRange,
            };
          } else {
            focusState.phase = "focused";
            focusState.startTime = currentTime;
          }
        } else if (focusState.phase === "focused") {
          if (elapsed < focusState.focusDuration) {
            const targetHeading = google.maps.geometry.spherical.computeHeading(
              new google.maps.LatLng(lastCarPosition),
              new google.maps.LatLng(focusState.target),
            );

            const smoothedHeading = smoothValue(
              lastState.current.heading,
              targetHeading,
              smoothing,
            );

            onCameraChange({
              center: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
                altitude: cameraHeight,
              },
              heading: smoothedHeading,
              tilt: 60,
              range: 200,
              roll: 0,
            });

            lastState.current = {
              position: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
              },
              heading: smoothedHeading,
              tilt: 60,
              range: 200,
            };
          } else {
            focusState.phase = "transitioning-from";
            focusState.startTime = currentTime;
          }
        } else if (focusState.phase === "transitioning-from") {
          const progress = Math.min(elapsed / focusState.transitionDuration, 1);
          const easedProgress = easeInOutCubic(progress);

          if (progress < 1) {
            const targetHeading = focusState.originalState!.heading;
            const interpolatedHeading = interpolateAngle(
              lastState.current.heading,
              targetHeading,
              easedProgress,
            );

            const smoothedHeading = smoothValue(
              lastState.current.heading,
              interpolatedHeading,
              smoothing,
            );

            const targetTilt =
              60 + (focusState.originalState!.tilt - 60) * easedProgress;
            const smoothedTilt = smoothValue(
              lastState.current.tilt,
              targetTilt,
              smoothing,
            );

            const targetRange =
              200 + (focusState.originalState!.range - 200) * easedProgress;
            const smoothedRange = smoothValue(
              lastState.current.range,
              targetRange,
              smoothing,
            );

            onCameraChange({
              center: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
                altitude: cameraHeight,
              },
              heading: smoothedHeading,
              tilt: smoothedTilt,
              range: smoothedRange,
              roll: 0,
            });

            lastState.current = {
              position: {
                lat: lastCarPosition.lat(),
                lng: lastCarPosition.lng(),
              },
              heading: smoothedHeading,
              tilt: smoothedTilt,
              range: smoothedRange,
            };
          } else {
            poiFocusRef.current = {
              isActive: false,
              phase: null,
              target: null,
              originalState: null,
              startTime: 0,
              transitionDuration: 1500,
              focusDuration: 8000,
            };
          }
        }

        animationRef.current = requestAnimationFrame(animate);
        return;
      }

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

      const smoothedHeading = smoothValue(
        lastState.current.heading,
        targetHeading,
        smoothing,
      );

      const targetCameraOffset = google.maps.geometry.spherical.computeOffset(
        smoothedCarPosition,
        -cameraDistance,
        smoothedHeading,
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
      const targetTilt =
        tilt +
        Math.sin(progress * Math.PI * 8) * 2 * speedFactor +
        turnFactor * 5;
      const smoothedTilt = smoothValue(
        lastState.current.tilt,
        targetTilt,
        smoothing,
      );

      const targetRange = cameraDistance * (1 + turnFactor * 0.2);
      const smoothedRange = smoothValue(
        lastState.current.range,
        targetRange,
        smoothing,
      );

      onCameraChange({
        center: {
          lat: smoothedCameraPosition.lat(),
          lng: smoothedCameraPosition.lng(),
          altitude: cameraHeight,
        },
        heading: smoothedHeading,
        tilt: smoothedTilt,
        range: smoothedRange,
        roll: Math.sin(progress * Math.PI * 4) * 2 * turnFactor,
      });

      lastState.current = {
        position: {
          lat: smoothedCarPosition.lat(),
          lng: smoothedCarPosition.lng(),
        },
        heading: smoothedHeading,
        tilt: smoothedTilt,
        range: smoothedRange,
      };

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        stopAnimation();
        options?.onAnimationEnd?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return {
    animateAlongPath,
    focusOnPOI,
    isAnimating,
    isPaused,
    stopAnimation,
    togglePause,
  };
};
