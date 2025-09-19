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
  const { geoJsonData, loading } = useCountryData(viewMode);
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

  // Reset France flag when data changes
  useEffect(() => {
    clickedFrance.current = false;
  }, [travelData, selectedStatus, viewMode]);

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
      weight: 0.8,
      opacity: 0.6,
      color: '#666',
      fillOpacity: 0.4
    };
  }, [travelDataMap, viewMode]);

  const onFeatureClick = useCallback((feature: any) => {
    if (viewMode === 'countries') {
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      if (countryCode) {
        onLocationClick(countryCode, undefined, selectedStatus);
      }
    } else {
      // Subdivision mode: treat each country as a subdivision for demonstration
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      const subdivisionCode = `${countryCode}-01`; // Mock subdivision code
      if (countryCode && subdivisionCode) {
        onLocationClick(countryCode, subdivisionCode, selectedStatus);
      }
    }
  }, [onLocationClick, selectedStatus, viewMode]);

  const onEachFeature = useCallback((feature: any, layer: any) => {
    let displayName: string;
    let key: string;

    if (viewMode === 'countries') {
      displayName = feature.properties.NAME || feature.properties.name;
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      key = countryCode;

      // Simple fix for France: if it's France and we already processed one, skip this one
      if (displayName === 'France' && clickedFrance.current) {
        return;
      }
      if (displayName === 'France') {
        clickedFrance.current = true;
        key = 'FR'; // Force France to use FR as key
      }

      // Skip features without proper names or ISO codes
      if (!displayName || (!key || key === '-99')) {
        return;
      }
    } else {
      // Subdivision mode: treat each country as a subdivision for demonstration
      const countryName = feature.properties.NAME || feature.properties.name;
      displayName = `${countryName} (Region 1)`; // Add "Region 1" to show it's subdivision mode
      const countryCode = feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2;
      const subdivisionCode = `${countryCode}-01`; // Mock subdivision code
      key = subdivisionCode;

      // Skip features without proper country codes
      if (!countryName || !countryCode || countryCode === '-99') {
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
        console.log('Debounced click for:', displayName);
        return;
      }
      lastClickTime.current = now;

      // Stop event propagation to prevent multiple features from being clicked
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      console.log('=== CLICK EVENT ===');
      console.log('Location clicked:', displayName, key);
      console.log('Feature properties:', JSON.stringify(feature.properties, null, 2));
      console.log('===================');
      onFeatureClick(feature);
    });

    layer.on('mouseover', () => {
      layer.setStyle({
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6
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