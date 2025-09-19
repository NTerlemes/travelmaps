import { useState } from 'react';
import styled from 'styled-components';
import { TravelMap } from './components/TravelMap';
import { TravelControls } from './components/TravelControls';
import { SaveLoadControls } from './components/SaveLoadControls';
import { TravelData, TravelStatus } from './types';
import { useTravelMaps } from './hooks/useTravelMaps';
import { ViewMode } from './hooks/useCountryData';

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

function App() {
  const [travelData, setTravelData] = useState<TravelData[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TravelStatus>(TravelStatus.VISITED);
  const [viewMode, setViewMode] = useState<ViewMode>('countries');
  const { savedMaps, saveMap, loadMap, deleteMap } = useTravelMaps();

  const updateTravelStatus = (countryCode: string, subdivisionCode: string | undefined, status: TravelStatus) => {
    console.log('updateTravelStatus called:', countryCode, subdivisionCode, status);
    setTravelData(prev => {
      const existing = prev.find(
        data => data.countryCode === countryCode && data.subdivisionCode === subdivisionCode
      );

      if (existing) {
        // If clicking with the same status, remove the label
        if (existing.status === status) {
          return prev.filter(data => !(data.countryCode === countryCode && data.subdivisionCode === subdivisionCode));
        }
        // If clicking with a different status, update to new status
        return prev.map(data =>
          data.countryCode === countryCode && data.subdivisionCode === subdivisionCode
            ? { ...data, status }
            : data
        );
      } else {
        // If no existing entry and not NONE, add new entry
        if (status !== TravelStatus.NONE) {
          return [...prev, { countryCode, subdivisionCode, status }];
        }
      }

      return prev;
    });
  };

  const handleSaveMap = (name: string) => {
    saveMap(name, travelData);
  };

  const handleLoadMap = (mapId: string) => {
    const loadedData = loadMap(mapId);
    if (loadedData) {
      setTravelData(loadedData);
    }
  };

  return (
    <AppContainer>
      <MapContainer>
        <TravelMap
          travelData={travelData}
          selectedStatus={selectedStatus}
          viewMode={viewMode}
          onLocationClick={updateTravelStatus}
        />
      </MapContainer>
      <ControlsContainer>
        <TravelControls
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          travelData={travelData}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClearAll={() => setTravelData([])}
        />
        <SaveLoadControls
          travelData={travelData}
          savedMaps={savedMaps}
          onSave={handleSaveMap}
          onLoad={handleLoadMap}
          onDelete={deleteMap}
        />
      </ControlsContainer>
    </AppContainer>
  );
}

export default App;