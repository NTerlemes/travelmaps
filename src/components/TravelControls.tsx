import { Fragment } from 'react';
import styled from 'styled-components';
import { TravelData, TravelStatus } from '../types';
import { DEFAULT_COLORS, COLOR_LABELS } from '../data/colors';
import { ViewMode } from '../hooks/useCountryData';

interface TravelControlsProps {
  selectedStatus: TravelStatus;
  onStatusChange: (status: TravelStatus) => void;
  travelData: TravelData[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClearAll: () => void;
}

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

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

const StatusButton = styled.button<{ $isSelected: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid ${props => props.$isSelected ? props.$color : '#ddd'};
  background: ${props => props.$isSelected ? props.$color + '20' : 'white'};
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.$color};
    background: ${props => props.$color + '10'};
  }
`;

const ColorDot = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  border: 1px solid #ccc;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
`;

const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

const StatCount = styled.div`
  font-weight: bold;
  color: #666;
`;

const ClearButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;

  &:hover {
    background: #d32f2f;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Title = styled.h1`
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.4;
`;

export const TravelControls: React.FC<TravelControlsProps> = ({
  selectedStatus,
  onStatusChange,
  travelData,
  viewMode,
  onViewModeChange,
  onClearAll
}) => {
  const getStatusCount = (status: TravelStatus) => {
    return travelData.filter(data => data.status === status).length;
  };

  const statusOptions = [
    TravelStatus.VISITED,
    TravelStatus.LIVED,
    TravelStatus.FROM,
    TravelStatus.CURRENT
  ];

  return (
    <ControlsWrapper>
      <div>
        <Title>Travel Maps</Title>
        <Subtitle>
          Click on {viewMode === 'countries' ? 'countries' : 'states/provinces'} to mark them with your selected travel status.
          Build your personal travel map!
        </Subtitle>
      </div>

      <Section>
        <SectionTitle>Map Detail Level</SectionTitle>
        <StatusButton
          $isSelected={viewMode === 'countries'}
          $color="#4CAF50"
          onClick={() => onViewModeChange('countries')}
        >
          🌍 Countries
        </StatusButton>
        <StatusButton
          $isSelected={viewMode === 'subdivisions'}
          $color="#2196F3"
          onClick={() => onViewModeChange('subdivisions')}
        >
          🗺️ States/Provinces
        </StatusButton>
      </Section>

      <Section>
        <SectionTitle>Select Travel Status</SectionTitle>
        {statusOptions.map(status => (
          <StatusButton
            key={status}
            $isSelected={selectedStatus === status}
            $color={DEFAULT_COLORS[status]}
            onClick={() => onStatusChange(status)}
          >
            <ColorDot $color={DEFAULT_COLORS[status]} />
            {COLOR_LABELS[status]}
          </StatusButton>
        ))}
      </Section>

      <Section>
        <SectionTitle>Travel Statistics</SectionTitle>
        <StatsGrid>
          {statusOptions.map(status => {
            const count = getStatusCount(status);
            return (
              <Fragment key={status}>
                <StatLabel>
                  <ColorDot $color={DEFAULT_COLORS[status]} />
                  {COLOR_LABELS[status]}
                </StatLabel>
                <StatCount>{count}</StatCount>
              </Fragment>
            );
          })}
        </StatsGrid>
      </Section>

      <Section>
        <ClearButton
          onClick={onClearAll}
          disabled={travelData.length === 0}
        >
          Clear All
        </ClearButton>
      </Section>
    </ControlsWrapper>
  );
};