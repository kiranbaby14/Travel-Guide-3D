import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useMap3DCameraEvents } from "./hooks/useMap3DCameraEvents";
import { useDeepCompareEffect } from "../hooks/utilityHooks";
import "./types/map3dTypes";
import {
  Map3DClickEvent,
  useMap3DClickEvents,
} from "./hooks/useMap3DClickEvents";
import { useMap3D } from "@/context/Map3DContext";

export type Map3DCameraProps = {
  center: google.maps.LatLngAltitudeLiteral;
  range?: number;
  heading?: number;
  tilt?: number;
  roll?: number;
};

export type Map3DProps = google.maps.maps3d.Map3DElementOptions & {
  onCameraChange?: (cameraProps: Map3DCameraProps) => void;
  onClick?: (event: Map3DClickEvent) => void; // Add click handler prop
  children?: React.ReactNode;
};

export const Map3D = forwardRef(
  (
    props: Map3DProps,
    forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>,
  ) => {
    const { map3DElement, map3dRef } = useMap3D();
    const [customElementsReady, setCustomElementsReady] = useState(false);

    useMap3DCameraEvents(map3DElement, (p) => {
      if (!props.onCameraChange) return;
      props.onCameraChange(p);
    });
    useMap3DClickEvents(map3DElement, props.onClick);

    useEffect(() => {
      customElements.whenDefined("gmp-map-3d").then(() => {
        setCustomElementsReady(true);
      });
    }, []);

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
    );
  },
);
