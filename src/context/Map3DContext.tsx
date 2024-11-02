import React, { createContext, useContext, ReactNode } from "react";

interface Map3DContextValue {
  map3DElement: google.maps.maps3d.Map3DElement | null;
  maps3d: any | null;
}

const Map3DContext = createContext<Map3DContextValue | null>(null);

interface Map3DProviderProps {
  children: ReactNode;
  value: Map3DContextValue;
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

export type { Map3DContextValue };
export { useMap3D, Map3DProvider };
