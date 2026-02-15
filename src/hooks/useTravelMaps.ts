import { useState, useEffect, useCallback } from 'react';
import { TravelData, UserTravelMap, MapScope, DetailLevel, AdminLevel } from '../types';

const STORAGE_KEY = 'travel-maps';

export const useTravelMaps = () => {
  const [savedMaps, setSavedMaps] = useState<UserTravelMap[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const maps = JSON.parse(stored);
        setSavedMaps(maps.map((map: any) => ({
          ...map,
          createdAt: new Date(map.createdAt),
          updatedAt: new Date(map.updatedAt)
        })));
      } catch (error) {
        console.error('Error loading saved maps:', error);
      }
    }
  }, []);

  const saveMap = useCallback((name: string, travelData: TravelData[], scope?: MapScope, detailLevel?: DetailLevel, adminLevel?: AdminLevel) => {
    const newMap: UserTravelMap = {
      id: Date.now().toString(),
      name,
      travelData: [...travelData],
      createdAt: new Date(),
      updatedAt: new Date(),
      scope,
      detailLevel,
      adminLevel
    };

    const updatedMaps = [...savedMaps, newMap];
    setSavedMaps(updatedMaps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMaps));

    return newMap.id;
  }, [savedMaps]);

  const loadMap = useCallback((id: string): UserTravelMap | null => {
    const map = savedMaps.find(m => m.id === id);
    return map ? { ...map, travelData: [...map.travelData] } : null;
  }, [savedMaps]);

  const deleteMap = useCallback((id: string) => {
    const updatedMaps = savedMaps.filter(m => m.id !== id);
    setSavedMaps(updatedMaps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMaps));
  }, [savedMaps]);

  const updateMap = useCallback((id: string, travelData: TravelData[], scope?: MapScope, detailLevel?: DetailLevel, adminLevel?: AdminLevel) => {
    const updatedMaps = savedMaps.map(map =>
      map.id === id
        ? { ...map, travelData: [...travelData], updatedAt: new Date(), scope, detailLevel, adminLevel }
        : map
    );
    setSavedMaps(updatedMaps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMaps));
  }, [savedMaps]);

  return {
    savedMaps,
    saveMap,
    loadMap,
    deleteMap,
    updateMap
  };
};