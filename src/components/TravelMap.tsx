import { useCallback, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { TravelData, TravelStatus } from '../types';
import { DEFAULT_COLORS } from '../data/colors';
import { useCountryData, ViewMode } from '../hooks/useCountryData';

interface TravelMapProps {
  travelData: TravelData[];
  selectedStatus: TravelStatus;
  viewMode: ViewMode;
  onLocationClick: (countryCode: string, subdivisionCode: string | undefined, status: TravelStatus) => void;
}

export const TravelMap: React.FC<TravelMapProps> = ({
  travelData,
  selectedStatus,
  viewMode,
  onLocationClick
}) => {
  const { geoJsonData, loading, error, retry } = useCountryData(viewMode);
  const lastClickTime = useRef<number>(0);
  const clickedFrance = useRef<boolean>(false);

  const center: LatLngExpression = [20, 0];
  const zoom = 2;

  const travelDataMap = useMemo(() => {
    const map = new Map<string, TravelStatus>();
    travelData.forEach(data => {
      const key = data.subdivisionCode
        ? `${data.countryCode}-${data.subdivisionCode}`
        : data.countryCode;
      map.set(key, data.status);
    });
    return map;
  }, [travelData]);

  // Reset France flag when data changes or when GeoJSON is processed
  useEffect(() => {
    clickedFrance.current = false;
  }, [travelData, selectedStatus, viewMode, geoJsonData]);

  const getFeatureStyle = useCallback((feature: any) => {
    let key: string;
    if (viewMode === 'countries') {
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      key = countryCode;
    } else {
      // Subdivision mode: treat each country as a subdivision for demonstration
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      const subdivisionCode = `${countryCode}-01`; // Mock subdivision code
      key = subdivisionCode;
    }
    const status = travelDataMap.get(key) || TravelStatus.NONE;

    return {
      fillColor: DEFAULT_COLORS[status],
      weight: status === TravelStatus.NONE ? 0.5 : 1,
      opacity: status === TravelStatus.NONE ? 0.3 : 0.8,
      color: status === TravelStatus.NONE ? '#999' : '#555',
      fillOpacity: status === TravelStatus.NONE ? 0.15 : 0.7
    };
  }, [travelDataMap, viewMode]);

  const onFeatureClick = useCallback((feature: any) => {
    if (viewMode === 'countries') {
      let countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;

      // Special handling for France
      const displayName = feature.properties.NAME || feature.properties.name;
      const isFrance = displayName === 'France' || displayName === 'French Republic' ||
                       countryCode === 'FR' || countryCode === 'FRA' || feature.properties.NAME_EN === 'France';

      if (isFrance) {
        countryCode = 'FR'; // Force France to use FR
      }

      if (countryCode && countryCode !== '-99') {
        onLocationClick(countryCode, undefined, selectedStatus);
      }
    } else {
      // Subdivision mode: treat each country as a subdivision for demonstration
      let countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;

      // Special handling for France in subdivision mode
      const countryName = feature.properties.NAME || feature.properties.name;
      const isFrance = countryName === 'France' || countryName === 'French Republic' ||
                       countryCode === 'FR' || countryCode === 'FRA' || feature.properties.NAME_EN === 'France';

      if (isFrance) {
        countryCode = 'FR'; // Force France to use FR
      }

      const subdivisionCode = `${countryCode}-01`; // Mock subdivision code
      if (countryCode && countryCode !== '-99' && subdivisionCode) {
        onLocationClick(countryCode, subdivisionCode, selectedStatus);
      }
    }
  }, [onLocationClick, selectedStatus, viewMode]);

  const onEachFeature = useCallback((feature: any, layer: any) => {
    let displayName: string;
    let key: string;

    if (viewMode === 'countries') {
      displayName = feature.properties.NAME || feature.properties.name;
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] ||
                         feature.properties.ISO_A2 ||
                         feature.properties.iso_a2 ||
                         feature.properties.ISO ||
                         feature.properties.id ||
                         feature.properties.ID;
      key = countryCode;

      // Fix for France duplicates: handle both "France" and "French Republic"
      const isFrance = displayName === 'France' || displayName === 'French Republic' ||
                       key === 'FR' || key === 'FRA' || feature.properties.NAME_EN === 'France';

      // Create a fallback key for countries without ISO codes
      if (!key && displayName) {
        // Use a normalized version of the country name as a fallback key
        key = displayName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
      }


      if (isFrance) {
        if (clickedFrance.current) {
          return; // Skip this France duplicate
        }
        clickedFrance.current = true;
        key = 'FR'; // Force France to use FR as key
        displayName = 'France'; // Normalize the display name
      }

      // Skip features without proper names or keys
      if (!displayName || !key) {
        return;
      }
    } else {
      // Subdivision mode: treat each country as a subdivision for demonstration
      const countryName = feature.properties.NAME || feature.properties.name;
      let countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;

      // Fix for France duplicates in subdivision mode
      const isFrance = countryName === 'France' || countryName === 'French Republic' ||
                       countryCode === 'FR' || countryCode === 'FRA' || feature.properties.NAME_EN === 'France';

      if (isFrance && clickedFrance.current) {
        return; // Skip this France duplicate
      }
      if (isFrance) {
        clickedFrance.current = true;
        countryCode = 'FR'; // Force France to use FR as key
      }

      displayName = `${isFrance ? 'France' : countryName} (Region 1)`; // Add "Region 1" to show it's subdivision mode
      const subdivisionCode = `${countryCode}-01`; // Mock subdivision code
      key = subdivisionCode;

      // Skip features without proper country codes, but allow France even with -99
      if (!countryName || (!countryCode || countryCode === '-99') && !isFrance) {
        return;
      }
    }

    const currentStatus = travelDataMap.get(key) || TravelStatus.NONE;

    layer.bindTooltip(`
      <div style="font-size: 12px;">
        <strong>${displayName}</strong><br/>
        Status: ${currentStatus === TravelStatus.NONE ? 'Not marked' : currentStatus}<br/>
        <em>Click to mark as: ${selectedStatus}</em>
      </div>
    `, {
      sticky: true,
      direction: 'top'
    });


    layer.on('click', (e: any) => {
      const now = Date.now();
      // Debounce clicks within 100ms to prevent multiple rapid clicks
      if (now - lastClickTime.current < 100) {
        return;
      }
      lastClickTime.current = now;

      // Stop event propagation to prevent multiple features from being clicked
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      onFeatureClick(feature);
    });

    layer.on('mouseover', () => {
      const hoverOpacity = currentStatus === TravelStatus.NONE ? 0.4 : 0.85;
      layer.setStyle({
        weight: 2,
        opacity: 1,
        fillOpacity: hoverOpacity
      });
    });

    layer.on('mouseout', () => {
      layer.setStyle(getFeatureStyle(feature));
    });
  }, [onFeatureClick, selectedStatus, travelDataMap, getFeatureStyle, viewMode]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading map data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#d32f2f', marginBottom: '16px' }}>
          Failed to load map data
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          {error}
        </div>
        <button
          onClick={retry}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {geoJsonData && (
        <GeoJSON
          key={`${JSON.stringify(travelData)}-${selectedStatus}-${viewMode}`}
          data={geoJsonData}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
};