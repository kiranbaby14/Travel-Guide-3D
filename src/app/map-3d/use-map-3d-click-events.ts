import { useEffect } from "react";

export type Map3DClickEvent = CustomEvent & {
  position?: { lat: number; lng: number; altitude?: number };
};

export function useMap3DClickEvents(
  map3DElement: google.maps.maps3d.Map3DElement | null,
  onClick?: (event: Map3DClickEvent) => void,
) {
  useEffect(() => {
    if (!map3DElement || !onClick) return;

    map3DElement.addEventListener("gmp-click", onClick as EventListener);
    return () => {
      map3DElement.removeEventListener("gmp-click", onClick as EventListener);
    };
  }, [map3DElement, onClick]);
}
