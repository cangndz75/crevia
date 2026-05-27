import { createContext, useContext } from 'react';

export type MapDisplaySize = {
  width: number;
  height: number;
};

export const MapDisplaySizeContext = createContext<MapDisplaySize>({
  width: 0,
  height: 0,
});

export function useMapDisplaySize(): MapDisplaySize {
  return useContext(MapDisplaySizeContext);
}
