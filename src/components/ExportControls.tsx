import { useState } from 'react';
import styled from 'styled-components';
import { exportMapAsImage } from '../utils/mapExport';

type ExportFormat = 'png' | 'jpeg' | 'svg';

interface ExportControlsProps {
  mapRef: React.RefObject<HTMLDivElement>;
  centerMap: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ExportButton = styled.button`
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #2196F3;
  color: white;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #1976D2;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export const ExportControls: React.FC<ExportControlsProps> = ({
  mapRef,
  centerMap,
  onSuccess,
  onError,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!mapRef.current || exporting) return;

    setExporting(true);
    try {
      await centerMap();
      await exportMapAsImage(mapRef.current, format);
      onSuccess(`Map exported as ${format.toUpperCase()}!`);
    } catch {
      onError('Failed to export map. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const disabled = exporting || !mapRef.current;

  return (
    <Section>
      <SectionTitle>Export Map</SectionTitle>
      <ButtonGroup>
        <ExportButton disabled={disabled} onClick={() => handleExport('png')}>
          PNG
        </ExportButton>
        <ExportButton disabled={disabled} onClick={() => handleExport('jpeg')}>
          JPEG
        </ExportButton>
        <ExportButton disabled={disabled} onClick={() => handleExport('svg')}>
          SVG
        </ExportButton>
      </ButtonGroup>
    </Section>
  );
};
