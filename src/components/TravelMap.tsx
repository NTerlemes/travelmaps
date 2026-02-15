import { useCallback, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import { TravelData, TravelStatus, MapScope, DetailLevel, AdminLevel } from '../types';
import { DEFAULT_COLORS } from '../data/colors';
import { useGeoData } from '../hooks/useGeoData';
import { extractFeatureIdentifiers, getFeatureKey } from '../utils/featureProperties';
import { getContinentBounds, getCountryBounds } from '../data/geography';
import { DebugPanel } from './DebugPanel';

interface TravelMapProps {
  travelData: TravelData[];
  selectedStatus: TravelStatus;
  scope: MapScope;
  detailLevel: DetailLevel;
  adminLevel?: AdminLevel;
  mapRef?: React.RefObject<HTMLDivElement>;
  mapInstanceRef?: React.MutableRefObject<L.Map | null>;
  onLocationClick: (countryCode: string, subdivisionCode: string | undefined, status: TravelStatus) => void;
}

/**
 * Sub-component that exposes the Leaflet map instance via a ref.
 */
const MapInstanceExposer: React.FC<{ mapInstanceRef: React.MutableRefObject<L.Map | null> }> = ({ mapInstanceRef }) => {
  const map = useMap();
  useEffect(() => {
    mapInstanceRef.current = map;
    return () => { mapInstanceRef.current = null; };
  }, [map, mapInstanceRef]);
  return null;
};

/**
 * Sub-component that fits map bounds when scope changes.
 */
const MapBoundsController: React.FC<{ scope: MapScope }> = ({ scope }) => {
  const map = useMap();

  useEffect(() => {
    let bounds: [[number, number], [number, number]] | null = null;

    if (scope.type === 'continent') {
      bounds = getContinentBounds(scope.continent);
    } else if (scope.type === 'country') {
      bounds = getCountryBounds(scope.countryCode);
    }

    if (bounds) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] });
    } else {
      // World view
      map.setView([20, 0], 2);
    }
  }, [map, scope]);

  return null;
};

export const TravelMap: React.FC<TravelMapProps> = ({
  travelData,
  selectedStatus,
  scope,
  detailLevel,
  adminLevel,
  mapRef,
  mapInstanceRef,
  onLocationClick
}) => {
  const { geoJsonData, loading, error, retry, dataVersion } = useGeoData({ scope, detailLevel, adminLevel });
  const lastClickTime = useRef<number>(0);
  const geoJsonRef = useRef<any>(null);

  const isSubdivisionData = detailLevel === 'subdivisions';

  // Store mutable values in refs so GeoJSON callbacks stay stable
  const selectedStatusRef = useRef(selectedStatus);
  selectedStatusRef.current = selectedStatus;
  const onLocationClickRef = useRef(onLocationClick);
  onLocationClickRef.current = onLocationClick;
  const travelDataMapRef = useRef(new Map<string, TravelStatus>());

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
    travelDataMapRef.current = map;
    return map;
  }, [travelData]);

  // Pre-process GeoJSON to deduplicate features (for country-level data)
  const processedGeoJson = useMemo(() => {
    if (!geoJsonData) return null;

    if (isSubdivisionData) {
      // Subdivision data typically doesn't need deduplication
      return geoJsonData;
    }

    // Country-level: deduplicate (e.g., France)
    const seenCodes = new Set<string>();
    const deduped = geoJsonData.features.filter((feature: any) => {
      const ids = extractFeatureIdentifiers(feature, false);
      if (!ids) return true; // Keep features we can't parse
      if (seenCodes.has(ids.code)) return false;
      seenCodes.add(ids.code);
      return true;
    });

    return { ...geoJsonData, features: deduped };
  }, [geoJsonData, isSubdivisionData]);

  const getFeatureStyle = useCallback((feature: any) => {
    const ids = extractFeatureIdentifiers(feature, isSubdivisionData);
    const key = ids ? getFeatureKey(ids) : '';
    const status = travelDataMapRef.current.get(key) || TravelStatus.NONE;

    return {
      fillColor: DEFAULT_COLORS[status],
      weight: status === TravelStatus.NONE ? 0.5 : 1,
      opacity: status === TravelStatus.NONE ? 0.3 : 0.8,
      color: status === TravelStatus.NONE ? '#999' : '#555',
      fillOpacity: status === TravelStatus.NONE ? 0.15 : 0.7
    };
  }, [isSubdivisionData]);

  // Re-apply styles to all layers when travelData changes (e.g. on load)
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer: any) => {
      if (layer.feature) {
        layer.setStyle(getFeatureStyle(layer.feature));
      }
    });
  }, [travelDataMap, getFeatureStyle]);

  const onEachFeature = useCallback((feature: any, layer: any) => {
    const ids = extractFeatureIdentifiers(feature, isSubdivisionData);
    if (!ids) return;

    const key = getFeatureKey(ids);

    layer.bindTooltip(`
      <div style="font-size: 12px;">
        <strong>${ids.name}</strong><br/>
        <em>Click to mark</em>
      </div>
    `, {
      sticky: true,
      direction: 'top'
    });

    layer.on('click', (e: any) => {
      const now = Date.now();
      if (now - lastClickTime.current < 100) return;
      lastClickTime.current = now;

      e.originalEvent.stopPropagation();

      if (ids.isSubdivision) {
        onLocationClickRef.current(ids.countryCode, ids.code, selectedStatusRef.current);
      } else {
        onLocationClickRef.current(ids.code, undefined, selectedStatusRef.current);
      }
    });

    layer.on('mouseover', () => {
      const status = travelDataMapRef.current.get(key) || TravelStatus.NONE;
      const hoverOpacity = status === TravelStatus.NONE ? 0.4 : 0.85;
      layer.setStyle({
        weight: 2,
        opacity: 1,
        fillOpacity: hoverOpacity
      });
    });

    layer.on('mouseout', () => {
      layer.setStyle(getFeatureStyle(feature));
    });
  }, [getFeatureStyle, isSubdivisionData]);

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
    <div ref={mapRef} style={{ height: '100%', width: '100%', position: 'relative' }}>
      {import.meta.env.DEV && <DebugPanel geoJsonData={processedGeoJson} />}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {mapInstanceRef && <MapInstanceExposer mapInstanceRef={mapInstanceRef} />}
        <MapBoundsController scope={scope} />

        {processedGeoJson && (
          <GeoJSON
            ref={geoJsonRef}
            key={`${scope.type}-${detailLevel}-${adminLevel || 'ADM1'}-v${dataVersion}`}
            data={processedGeoJson}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};
