import { useState } from 'react';
import styled from 'styled-components';
import { TravelMap } from './components/TravelMap';
import { TravelControls } from './components/TravelControls';
import { SaveLoadControls } from './components/SaveLoadControls';
import { ToastContainer } from './components/ToastContainer';
import { TravelData, TravelStatus } from './types';
import { useTravelMaps } from './hooks/useTravelMaps';
import { useToast } from './hooks/useToast';
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
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  const updateTravelStatus = (countryCode: string, subdivisionCode: string | undefined, status: TravelStatus) => {
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
    try {
      saveMap(name, travelData);
      showSuccess(`Map "${name}" saved successfully!`);
    } catch (error) {
      showError('Failed to save map. Please try again.');
      console.error('Save error:', error);
    }
  };

  const handleLoadMap = (mapId: string) => {
    try {
      const loadedData = loadMap(mapId);
      if (loadedData) {
        setTravelData(loadedData);
        const mapName = savedMaps.find(m => m.id === mapId)?.name || 'Saved map';
        showSuccess(`Loaded "${mapName}" successfully!`);
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
          onClearAll={handleClearAll}
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