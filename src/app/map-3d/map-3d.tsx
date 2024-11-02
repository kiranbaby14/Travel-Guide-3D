import { useMapsLibrary } from "@vis.gl/react-google-maps";
import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useMap3DCameraEvents } from "./hooks/use-map-3d-camera-events";
import { useCallbackRef, useDeepCompareEffect } from "../utility-hooks";
import "./types/map-3d-types";
import {
  Map3DClickEvent,
  useMap3DClickEvents,
} from "./hooks/use-map-3d-click-events";
import { Map3DProvider } from "@/context/Map3DContext";

interface IFlyCameraOptions {
  endCamera: {
    center: google.maps.LatLngLiteral;
    tilt: number;
    range: number;
  };
  durationMillis?: number;
}

export type Map3DProps = google.maps.maps3d.Map3DElementOptions & {
  onCameraChange?: (cameraProps: Map3DCameraProps) => void;
  onClick?: (event: Map3DClickEvent) => void; // Add click handler prop
  children?: React.ReactNode;
};

export type Map3DCameraProps = {
  center: google.maps.LatLngAltitudeLiteral;
  range: number;
  heading: number;
  tilt: number;
  roll: number;
};

export const Map3D = forwardRef(
  (
    props: Map3DProps,
    forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>,
  ) => {
    const maps3d = useMapsLibrary("maps3d");

    const [map3DElement, map3dRef] =
      useCallbackRef<google.maps.maps3d.Map3DElement>();

    useMap3DCameraEvents(map3DElement, (p) => {
      if (!props.onCameraChange) return;
      props.onCameraChange(p);
    });

    useMap3DClickEvents(map3DElement, props.onClick);

    const [customElementsReady, setCustomElementsReady] = useState(false);

    useEffect(() => {
      customElements.whenDefined("gmp-map-3d").then(() => {
        setCustomElementsReady(true);
      });
    }, []);

    const flyCameraTo = useCallback(
      (options: IFlyCameraOptions) => {
        console.log("fj");

        if (!map3DElement) return;

        map3DElement.flyCameraTo({
          endCamera: {
            ...options.endCamera,
          },
          durationMillis: options.durationMillis || 5000,
        });
      },
      [map3DElement],
    );

    const { center, heading, tilt, range, roll, children, ...map3dOptions } =
      props;

    useDeepCompareEffect(() => {
      if (!map3DElement) return;
      // copy all values from map3dOptions to the map3D element itself
      Object.assign(map3DElement, map3dOptions);
    }, [map3DElement, map3dOptions]);

    useImperativeHandle<
      google.maps.maps3d.Map3DElement | null,
      google.maps.maps3d.Map3DElement | null
    >(forwardedRef, () => map3DElement, [map3DElement]);

    if (!customElementsReady) return null;

    return (
      <Map3DProvider value={{ map3DElement, maps3d, flyCameraTo }}>
        <gmp-map-3d
          ref={map3dRef}
          center={center as object}
          range={props.range as number}
          heading={props.heading as number}
          tilt={props.tilt as number}
          roll={props.roll as number}
        >
          {children}
        </gmp-map-3d>
      </Map3DProvider>
    );
  },
);
