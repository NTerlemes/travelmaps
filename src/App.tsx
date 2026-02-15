import { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import L, { LatLngBoundsExpression } from 'leaflet';
import { TravelMap } from './components/TravelMap';
import { TravelControls } from './components/TravelControls';
import { SaveLoadControls } from './components/SaveLoadControls';
import { ExportControls } from './components/ExportControls';
import { LandingPage } from './components/LandingPage';
import { ToastContainer } from './components/ToastContainer';
import { TravelData, TravelStatus, MapScope, DetailLevel, AdminLevel } from './types';
import { useTravelMaps } from './hooks/useTravelMaps';
import { useToast } from './hooks/useToast';
import { getContinentBounds, getCountryBounds } from './data/geography';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
`;

const ControlsContainer = styled.div`
  width: 300px;
  background: white;
  border-left: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #bbb;
  }
`;

const ScopeLabel = styled.div`
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

function getScopeLabel(scope: MapScope): string {
  switch (scope.type) {
    case 'world': return 'World';
    case 'continent': return scope.continent;
    case 'country': return scope.countryName;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'map'>('landing');
  const [mapScope, setMapScope] = useState<MapScope | null>(null);
  const [travelData, setTravelData] = useState<TravelData[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TravelStatus>(TravelStatus.VISITED);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('countries');
  const [adminLevel, setAdminLevel] = useState<AdminLevel>('ADM1');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { savedMaps, saveMap, loadMap, deleteMap } = useTravelMaps();
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  const handleScopeSelected = (scope: MapScope) => {
    setMapScope(scope);
    setTravelData([]); // Independent data per scope
    setDetailLevel(scope.type === 'country' ? 'subdivisions' : 'countries');
    setAdminLevel('ADM1');
    setCurrentPage('map');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
    setMapScope(null);
    setTravelData([]);
  };

  const updateTravelStatus = (countryCode: string, subdivisionCode: string | undefined, status: TravelStatus) => {
    setTravelData(prev => {
      const existing = prev.find(
        data => data.countryCode === countryCode && data.subdivisionCode === subdivisionCode
      );

      if (existing) {
        if (existing.status === status) {
          return prev.filter(data => !(data.countryCode === countryCode && data.subdivisionCode === subdivisionCode));
        }
        return prev.map(data =>
          data.countryCode === countryCode && data.subdivisionCode === subdivisionCode
            ? { ...data, status }
            : data
        );
      } else {
        if (status !== TravelStatus.NONE) {
          return [...prev, { countryCode, subdivisionCode, status }];
        }
      }

      return prev;
    });
  };

  const handleSaveMap = (name: string) => {
    try {
      saveMap(name, travelData, mapScope!, detailLevel, adminLevel);
      showSuccess(`Map "${name}" saved successfully!`);
    } catch (error) {
      showError('Failed to save map. Please try again.');
      console.error('Save error:', error);
    }
  };

  const handleLoadMap = (mapId: string) => {
    try {
      const loadedMap = loadMap(mapId);
      if (loadedMap) {
        setTravelData(loadedMap.travelData);

        if (loadedMap.scope) {
          setMapScope(loadedMap.scope);
          setDetailLevel(loadedMap.detailLevel || (loadedMap.scope.type === 'country' ? 'subdivisions' : 'countries'));
          setAdminLevel(loadedMap.adminLevel || 'ADM1');
          setCurrentPage('map');
        }

        showSuccess(`Loaded "${loadedMap.name}" successfully!`);
      } else {
        showError('Failed to load map. Map data not found.');
      }
    } catch (error) {
      showError('Failed to load map. Please try again.');
      console.error('Load error:', error);
    }
  };

  const handleDeleteMap = (mapId: string) => {
    try {
      const mapName = savedMaps.find(m => m.id === mapId)?.name || 'Map';
      deleteMap(mapId);
      showInfo(`"${mapName}" deleted.`);
    } catch (error) {
      showError('Failed to delete map. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const handleClearAll = () => {
    const count = travelData.length;
    setTravelData([]);
    if (count > 0) {
      showInfo(`Cleared ${count} travel location${count === 1 ? '' : 's'}.`);
    }
  };

  const handleAdminLevelChange = (level: AdminLevel) => {
    setAdminLevel(level);
    setTravelData([]);
    showInfo(`Switched to ${level} administrative level.`);
  };

  const centerMap = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map || !mapScope) return;

    if (mapScope.type === 'continent') {
      const bounds = getContinentBounds(mapScope.continent);
      if (bounds) map.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] });
    } else if (mapScope.type === 'country') {
      const bounds = getCountryBounds(mapScope.countryCode);
      if (bounds) map.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] });
    } else {
      map.setView([20, 0], 2);
    }

    // Wait for tiles to finish loading before capture
    await new Promise<void>(resolve => {
      const tileLayer = Object.values((map as any)._layers).find(
        (layer: any) => layer._url
      ) as any;
      if (!tileLayer || !tileLayer._loading) {
        // Tiles already loaded or no tile layer
        setTimeout(resolve, 300);
        return;
      }
      const onLoad = () => {
        tileLayer.off('load', onLoad);
        setTimeout(resolve, 300);
      };
      tileLayer.on('load', onLoad);
      // Fallback timeout in case tiles never fire 'load'
      setTimeout(resolve, 2000);
    });
  }, [mapScope]);

  if (currentPage === 'landing' || !mapScope) {
    return (
      <>
        <LandingPage onScopeSelected={handleScopeSelected} />
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </>
    );
  }

  return (
    <AppContainer>
      <MapContainer>
        <TravelMap
          travelData={travelData}
          selectedStatus={selectedStatus}
          scope={mapScope}
          detailLevel={detailLevel}
          adminLevel={adminLevel}
          mapRef={mapRef}
          mapInstanceRef={mapInstanceRef}
          onLocationClick={updateTravelStatus}
        />
      </MapContainer>
      <ControlsContainer>
        <BackButton onClick={handleBackToLanding}>
          &larr; Back
        </BackButton>
        <ScopeLabel>Scope: {getScopeLabel(mapScope)}</ScopeLabel>
        <TravelControls
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          travelData={travelData}
          scope={mapScope}
          detailLevel={detailLevel}
          onDetailLevelChange={setDetailLevel}
          adminLevel={adminLevel}
          onAdminLevelChange={handleAdminLevelChange}
          onClearAll={handleClearAll}
        />
        <ExportControls
          mapRef={mapRef}
          centerMap={centerMap}
          onSuccess={showSuccess}
          onError={showError}
        />
        <SaveLoadControls
          travelData={travelData}
          savedMaps={savedMaps}
          onSave={handleSaveMap}
          onLoad={handleLoadMap}
          onDelete={handleDeleteMap}
        />
      </ControlsContainer>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </AppContainer>
  );
}

export default App;
