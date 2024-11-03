import { useMap3D } from "@/context/Map3DContext";
import React, { useCallback } from "react";

const MapControls = React.memo(() => {
  const { flyCameraTo } = useMap3D();

  const handleFlyToSFO = useCallback(() => {
    flyCameraTo({
      endCamera: {
        center: { lat: 40.7079, lng: -74.0132, altitude: 1300 },
        tilt: 67.5,
        range: 1000,
      },
      durationMillis: 5000,
    });
  }, [flyCameraTo]);

  return (
    <button
      className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow"
      onClick={handleFlyToSFO}
    >
      Fly to Location
    </button>
  );
});

export { MapControls };
