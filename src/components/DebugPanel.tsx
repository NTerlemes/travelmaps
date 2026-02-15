import { useState, useMemo } from 'react';

interface DebugPanelProps {
  geoJsonData: any | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ geoJsonData }) => {
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => {
    if (!geoJsonData?.features) return null;

    const countByCountry = new Map<string, number>();
    for (const f of geoJsonData.features) {
      const cc = f.properties?.iso_a2 || f.properties?.ISO_A2 || '??';
      countByCountry.set(cc, (countByCountry.get(cc) || 0) + 1);
    }

    const sorted = [...countByCountry.entries()].sort((a, b) => b[1] - a[1]);

    return {
      total: geoJsonData.features.length,
      byCountry: sorted,
    };
  }, [geoJsonData]);

  if (!stats) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      left: 10,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 11,
      fontFamily: 'monospace',
      maxHeight: 300,
      overflowY: 'auto',
      pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span>Total: {stats.total}</span>
        <button
          aria-label="toggle"
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            padding: 0,
          }}
        >
          {collapsed ? '+' : '−'}
        </button>
      </div>
      {!collapsed && (
        <div style={{ marginTop: 4 }}>
          {stats.byCountry.map(([cc, count]) => (
            <div key={cc} data-testid="country-count">{cc}: {count}</div>
          ))}
        </div>
      )}
    </div>
  );
};
