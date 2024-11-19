import { DOMAttributes, RefAttributes } from "react";

// add an overload signature for the useMapsLibrary hook, so typescript
// knows what the 'maps3d' library is.
declare module "@vis.gl/react-google-maps" {
  export function useMapsLibrary(
    name: "maps3d",
  ): typeof google.maps.maps3d | null;
}

// add the <gmp-map-3d> custom-element to the JSX.IntrinsicElements
// interface, so it can be used in jsx
declare global {
  // eslint-disable-next-line no-var
  var GOOGLE_MAPS_API_KEY: string | undefined;
  namespace google.maps.maps3d {
    interface Camera {
      center: google.maps.LatLngAltitudeLiteral;
      tilt?: number;
      heading?: number;
      range?: number;
    }

    interface CameraOptions {
      endCamera: Camera;
      durationMillis?: number;
    }

    // Extend the existing Map3DElement interface
    interface Map3DElement extends HTMLElement {
      flyCameraTo(options: CameraOptions): Promise<void>;
    }

    class Marker3DInteractiveElement extends globalThis.HTMLElement {
      position: google.maps.LatLngAltitudeLiteral;
      title?: string;
      altitudeMode: AltitudeMode;
      append(element: google.maps.marker.PinElement | Node): void;
      addEventListener(type: string, listener: EventListener): void;
      removeEventListener(type: string, listener: EventListener): void;
      remove(): void;
      firstChild: ChildNode | null;
      removeChild<T extends Node>(child: T): T;
      parentElement: HTMLElement | null;
    }

    enum AltitudeMode {
      ABSOLUTE = "ABSOLUTE",
      CLAMP_TO_GROUND = "CLAMP_TO_GROUND",
      RELATIVE_TO_GROUND = "RELATIVE_TO_GROUND",
      RELATIVE_TO_MESH = "RELATIVE_TO_MESH",
    }

    interface Map3DElementOptions {
      bounds?: google.maps.LatLngBoundsLiteral;
      camera?: Camera;
      // Add other Map3D options as needed
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      ["gmp-map-3d"]: CustomElement<
        google.maps.maps3d.Map3DElement,
        {
          [key in GmpMap3DAttributeNames]?: string | object | number;
        }
      >;
    }
  }
}

type GmpMap3DAttributeNames = keyof Omit<
  google.maps.maps3d.Map3DElementOptions,
  "bounds"
>;

// a helper type for CustomElement definitions
type CustomElement<TElem, TAttr> = Partial<
  TAttr &
    DOMAttributes<TElem> &
    RefAttributes<TElem> & {
      // for whatever reason, anything else doesn't work as children
      // of a custom element, so we allow `any` here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: any;
    }
>;
