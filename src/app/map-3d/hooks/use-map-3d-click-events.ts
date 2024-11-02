import { useEffect } from "react";

type Map3DClickEvent = CustomEvent & {
  position?: { lat: number; lng: number; altitude?: number };
  placeId?: string;
  fetchPlace?: () => Promise<google.maps.places.Place>;
};

const useMap3DClickEvents = (
  map3DElement: google.maps.maps3d.Map3DElement | null,
  onClick?: (event: Map3DClickEvent) => void,
) => {
  useEffect(() => {
    if (!map3DElement || !onClick) return;

    map3DElement.addEventListener("gmp-click", onClick as EventListener);
    return () => {
      map3DElement.removeEventListener("gmp-click", onClick as EventListener);
    };
  }, [map3DElement, onClick]);
};

export type { Map3DClickEvent };
export { useMap3DClickEvents };
