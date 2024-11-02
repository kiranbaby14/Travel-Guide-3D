import React, { createContext, useContext, ReactNode } from "react";

interface IMap3DContext {
  map3DElement: google.maps.maps3d.Map3DElement | null;
  maps3d: any | null;
  flyCameraTo?: (options: {
    endCamera: {
      center: google.maps.LatLngAltitudeLiteral;
      tilt: number;
      range: number;
    };
    durationMillis?: number;
  }) => void;
}

const Map3DContext = createContext<IMap3DContext | null>({
  map3DElement: null,
  maps3d: null,
  flyCameraTo: () => {},
});

interface Map3DProviderProps {
  children: ReactNode;
  value: IMap3DContext;
}

const Map3DProvider: React.FC<Map3DProviderProps> = ({ children, value }) => {
  return (
    <Map3DContext.Provider value={value}>{children}</Map3DContext.Provider>
  );
};

const useMap3D = () => {
  const context = useContext(Map3DContext);
  if (context === null) {
    throw new Error("useMap3D must be used within a Map3DProvider");
  }
  return context;
};

export type { IMap3DContext };
export { useMap3D, Map3DProvider };
