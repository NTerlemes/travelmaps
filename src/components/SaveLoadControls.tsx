import { useState } from 'react';
import styled from 'styled-components';
import { TravelData, UserTravelMap, MapScope } from '../types';

interface SaveLoadControlsProps {
  travelData: TravelData[];
  savedMaps: UserTravelMap[];
  onSave: (name: string) => void;
  onLoad: (mapId: string) => void;
  onDelete: (mapId: string) => void;
}

const Section = styled.div`
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
`;

const SaveForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;

  ${props => {
    if (props.$variant === 'danger') {
      return `
        background: #f44336;
        color: white;
        &:hover { background: #d32f2f; }
      `;
    }
    return `
      background: #4CAF50;
      color: white;
      &:hover { background: #45a049; }
    `;
  }}

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const MapList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MapItem = styled.div`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
`;

const MapName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const MapDate = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;

const MapActions = styled.div`
  display: flex;
  gap: 8px;
`;

const SmallButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;

  ${props => {
    if (props.$variant === 'danger') {
      return `
        background: #f44336;
        color: white;
        &:hover { background: #d32f2f; }
      `;
    }
    return `
      background: #2196F3;
      color: white;
      &:hover { background: #1976D2; }
    `;
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
`;

const MapScopeLabel = styled.div`
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
`;

function getScopeDisplayLabel(map: UserTravelMap): string | null {
  if (!map.scope) return null;
  switch (map.scope.type) {
    case 'world': return 'World';
    case 'continent': return map.scope.continent;
    case 'country': {
      const adminSuffix = map.adminLevel ? ` ${map.adminLevel}` : '';
      return `${map.scope.countryName}${adminSuffix}`;
    }
  }
}

export const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({
  travelData,
  savedMaps,
  onSave,
  onLoad,
  onDelete
}) => {
  const [mapName, setMapName] = useState('');

  const handleSave = () => {
    if (mapName.trim() && travelData.length > 0) {
      onSave(mapName.trim());
      setMapName('');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Section>
        <SectionTitle>Save Map</SectionTitle>
        <SaveForm>
          <Input
            type="text"
            placeholder="Enter map name..."
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            onClick={handleSave}
            disabled={!mapName.trim() || travelData.length === 0}
          >
            Save Current Map
          </Button>
        </SaveForm>
      </Section>

      <Section>
        <SectionTitle>Saved Maps ({savedMaps.length})</SectionTitle>
        <MapList>
          {savedMaps.length === 0 ? (
            <EmptyState>No saved maps yet</EmptyState>
          ) : (
            savedMaps.map(map => (
              <MapItem key={map.id}>
                <MapName>{map.name}</MapName>
                {getScopeDisplayLabel(map) && (
                  <MapScopeLabel data-testid="map-scope-label">
                    Scope: {getScopeDisplayLabel(map)}
                  </MapScopeLabel>
                )}
                <MapDate>
                  Saved: {formatDate(map.createdAt)}
                  {map.updatedAt > map.createdAt && (
                    <><br />Updated: {formatDate(map.updatedAt)}</>
                  )}
                </MapDate>
                <MapActions>
                  <SmallButton onClick={() => onLoad(map.id)}>
                    Load
                  </SmallButton>
                  <SmallButton
                    $variant="danger"
                    onClick={() => onDelete(map.id)}
                  >
                    Delete
                  </SmallButton>
                </MapActions>
              </MapItem>
            ))
          )}
        </MapList>
      </Section>
    </>
  );
};