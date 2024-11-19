import { useCallback, useEffect, useRef, useState } from "react";
import type { Map3DCameraProps } from "@/types";
import { calculateDuration, calculatePathLength } from "@/lib/routeUtils";

interface AnimationConfig {
  speedKmH?: number;
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
  const [isPoiFocused, setIsPoiFocused] = useState(false);
  const isPausedRef = useRef(false);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const durationRef = useRef(0);

  const lastState = useRef<AnimationState>({
    position: { lat: 0, lng: 0 },
    heading: 0,
    tilt: 0,
    range: 0,
  });

  const poiFocusRef = useRef({
    isActive: false,
    phase: null as "transitioning-to" | "focused" | "transitioning-from" | null,
    target: null as google.maps.LatLngLiteral | null,
    pathState: null as AnimationState | null,
    startTime: 0,
    totalPoiFocusTime: 0,
    wasPathPaused: false, // Add this to track pause state before POI focus
    transitionDuration: 1500,
    focusDuration: 3000,
    timeoutId: null as NodeJS.Timeout | null,
  });

  const pauseState = useRef({
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
    setIsPoiFocused(false);
    isPausedRef.current = false;
    pathRef.current = [];
    poiFocusRef.current = {
      isActive: false,
      phase: null,
      target: null,
      pathState: null,
      startTime: 0,
      totalPoiFocusTime: 0,
      wasPathPaused: false,
      transitionDuration: 1500,
      focusDuration: 3000,
      timeoutId: null,
    };
    pauseState.current = {
      pauseTime: 0,
      startTime: 0,
      totalPausedTime: 0,
    };

    // Reset last state
    lastState.current = {
      position: { lat: 0, lng: 0 },
      heading: 0,
      tilt: 0,
      range: 0,
    };
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((current) => {
      const newPausedState = !current;
      // Only process the state change if isPausedRef is different
      // This prevents double processing in Strict Mode which causes issue to "performance.now()" being added twice
      if (isPausedRef.current !== newPausedState) {
        isPausedRef.current = newPausedState;
        const currentTime = performance.now();

        if (newPausedState) {
          // Starting a pause
          pauseState.current.pauseTime = currentTime;
        } else {
          // Resuming
          pauseState.current.totalPausedTime +=
            currentTime - pauseState.current.pauseTime;
        }
      }
      return newPausedState;
    });
  }, []);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;

  const getShortestRotation = (start: number, end: number): number => {
    const normalized = normalizeAngle(end - start);
    return normalized > 180 ? normalized - 360 : normalized;
  };

  const interpolateAngle = (start: number, end: number, t: number): number => {
    const rotation = getShortestRotation(start, end);
    return normalizeAngle(start + rotation * t);
  };

  const focusOnPOI = useCallback(
    (target: google.maps.LatLngLiteral, focusDuration: number = 3000) => {
      if (!isAnimating) return;

      // Clear any existing timeout at function entry
      if (poiFocusRef.current.timeoutId) {
        clearTimeout(poiFocusRef.current.timeoutId);
      }

      // Only process if not already in POI focus or transitioning
      if (!poiFocusRef.current.isActive) {
        // Store the current pause state before POI focus
        const wasPathPaused = isPausedRef.current;
        const currentTime = performance.now();

        setIsPoiFocused(true);

        if (wasPathPaused) {
          // For paused state and POI focus (user manually entering POI focus),
          // just set a timeout to clear the POI focus
          const timeoutId = setTimeout(() => {
            setIsPoiFocused(false);
            poiFocusRef.current.timeoutId = null;
          }, focusDuration);

          poiFocusRef.current.timeoutId = timeoutId;
          return; // Return early, don't set up animation states
        }

        poiFocusRef.current = {
          isActive: true,
          phase: "transitioning-to",
          target,
          pathState: { ...lastState.current },
          startTime: currentTime,
          totalPoiFocusTime: poiFocusRef.current.totalPoiFocusTime,
          wasPathPaused,
          transitionDuration: 1500,
          focusDuration,
          timeoutId: null,
        };
      }
    },
    [isAnimating],
  );

  const handlePoiFocus = (
    currentTime: number,
    currentPosition: google.maps.LatLng,
    cameraHeight: number,
    smoothing: number,
  ) => {
    const {
      phase,
      target,
      pathState,
      startTime,
      transitionDuration,
      focusDuration,
      wasPathPaused,
    } = poiFocusRef.current;
    const elapsed = currentTime - startTime;

    if (phase === "transitioning-to" || phase === "transitioning-from") {
      const progress = Math.min(elapsed / transitionDuration, 1);
      const t =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const position = new google.maps.LatLng(
        pathState!.position.lat,
        pathState!.position.lng,
      );

      const targetHeading = google.maps.geometry.spherical.computeHeading(
        position,
        new google.maps.LatLng(target!.lat, target!.lng),
      );

      const startHeading =
        phase === "transitioning-to"
          ? pathState!.heading
          : lastState.current.heading;
      const endHeading =
        phase === "transitioning-to" ? targetHeading : pathState!.heading;

      const startTilt = phase === "transitioning-to" ? pathState!.tilt : 60;
      const endTilt = phase === "transitioning-to" ? 60 : pathState!.tilt;

      const startRange = phase === "transitioning-to" ? pathState!.range : 400;
      const endRange = phase === "transitioning-to" ? 400 : pathState!.range;

      const smoothedHeading = interpolateAngle(startHeading, endHeading, t);
      const smoothedTilt = startTilt + (endTilt - startTilt) * t;
      const smoothedRange = startRange + (endRange - startRange) * t;

      onCameraChange({
        center: {
          lat: position.lat(),
          lng: position.lng(),
          altitude: cameraHeight,
        },
        heading: smoothedHeading,
        tilt: smoothedTilt,
        range: smoothedRange,
        roll: 0,
      });

      Object.assign(lastState.current, {
        position: { lat: position.lat(), lng: position.lng() },
        heading: smoothedHeading,
        tilt: smoothedTilt,
        range: smoothedRange,
      });

      if (progress >= 1) {
        if (phase === "transitioning-to") {
          poiFocusRef.current.phase = "focused";
          poiFocusRef.current.totalPoiFocusTime += transitionDuration;
          poiFocusRef.current.startTime = currentTime;
        } else {
          setIsPoiFocused(false);
          // Add both the focus duration and final transition time
          poiFocusRef.current.totalPoiFocusTime +=
            focusDuration + transitionDuration;

          poiFocusRef.current.isActive = false;
          poiFocusRef.current.phase = null;
        }
      }
      return true;
    } else if (phase === "focused") {
      if (elapsed < focusDuration) {
        const position = new google.maps.LatLng(
          pathState!.position.lat,
          pathState!.position.lng,
        );

        const targetHeading = google.maps.geometry.spherical.computeHeading(
          position,
          new google.maps.LatLng(target!.lat, target!.lng),
        );

        onCameraChange({
          center: {
            lat: position.lat(),
            lng: position.lng(),
            altitude: cameraHeight,
          },
          heading: targetHeading,
          tilt: 60,
          range: 400,
          roll: 0,
        });

        Object.assign(lastState.current, {
          position: { lat: position.lat(), lng: position.lng() },
          heading: targetHeading,
          tilt: 60,
          range: 400,
        });
      } else {
        poiFocusRef.current.phase = "transitioning-from";
        poiFocusRef.current.startTime = currentTime;
      }
      return true;
    }
    return false;
  };

  const animateAlongPath = (
    path: google.maps.LatLng[],
    config: AnimationConfig = {},
  ) => {
    if (path.length < 2) return;
    stopAnimation();

    pathRef.current = path;

    const {
      speedKmH = 150, // Default speed
      cameraHeight = 100,
      cameraDistance = 300,
      tilt = 45,
      smoothing = 3,
    } = config;

    // Calculate path length and duration
    const pathLength = calculatePathLength(path);
    const duration = calculateDuration(pathLength, speedKmH);

    durationRef.current = duration;

    // Initialize with the first point
    lastState.current = {
      position: {
        lat: path[0].lat(),
        lng: path[0].lng(),
      },
      heading: 0,
      tilt,
      range: cameraDistance,
    };

    pauseState.current.startTime = performance.now();
    pauseState.current.totalPausedTime = 0;
    setIsAnimating(true);

    const animate = (currentTime: number) => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentPosition = new google.maps.LatLng(
        lastState.current.position.lat,
        lastState.current.position.lng,
      );

      if (
        poiFocusRef.current.isActive &&
        poiFocusRef.current.target &&
        handlePoiFocus(currentTime, currentPosition, cameraHeight, smoothing)
      ) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed =
        currentTime -
        pauseState.current.startTime -
        pauseState.current.totalPausedTime -
        poiFocusRef.current.totalPoiFocusTime;

      const progress = Math.min(Math.max(elapsed / duration, 0), 1);

      if (progress < 1) {
        const pathProgress = progress * (pathRef.current.length - 1);
        const index = Math.max(
          0,
          Math.min(Math.floor(pathProgress), pathRef.current.length - 2),
        );
        const nextIndex = Math.min(index + 1, pathRef.current.length - 1);
        const subProgress = pathProgress - index;

        const currentPoint = pathRef.current[index];
        const nextPoint = pathRef.current[nextIndex];
        const lookAheadPoint =
          pathRef.current[Math.min(index + 2, pathRef.current.length - 1)];

        const targetPosition = google.maps.geometry.spherical.interpolate(
          currentPoint,
          nextPoint,
          subProgress,
        );

        const targetHeading = google.maps.geometry.spherical.computeHeading(
          targetPosition,
          lookAheadPoint,
        );

        const smoothedHeading = interpolateAngle(
          lastState.current.heading,
          targetHeading,
          1 / smoothing,
        );
        const turnFactor =
          Math.abs(
            getShortestRotation(lastState.current.heading, targetHeading),
          ) / 180;

        onCameraChange({
          center: {
            lat: targetPosition.lat(),
            lng: targetPosition.lng(),
            altitude: cameraHeight,
          },
          heading: smoothedHeading,
          tilt: tilt + turnFactor * 5,
          range: cameraDistance * (1 + turnFactor * 0.3),
          roll: turnFactor * 2,
        });

        Object.assign(lastState.current, {
          position: { lat: targetPosition.lat(), lng: targetPosition.lng() },
          heading: smoothedHeading,
          tilt: tilt + turnFactor * 5,
          range: cameraDistance * (1 + turnFactor * 0.3),
        });

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
    setIsAnimating,
    isPaused,
    isPoiFocused,
    stopAnimation,
    togglePause,
  };
};
