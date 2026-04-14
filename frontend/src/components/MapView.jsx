/**
 * MapView.jsx — Leaflet map showing complaint locations as clustered pins
 */

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function MapView({ complaints = [], height = '400px', center = [11.127123, 78.656891] }) {
  // Filter complaints that have coordinates
  const mapped = complaints.filter(
    (c) => c.location?.lat && c.location?.lng
  );

  return (
    <div style={{ height, borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {mapped.map((c) => (
          <CircleMarker
            key={c._id || c.trackingId}
            center={[c.location.lat, c.location.lng]}
            radius={c.priority === 'high' ? 10 : c.priority === 'medium' ? 8 : 6}
            fillColor={PRIORITY_COLORS[c.priority] || '#6b7280'}
            color="white"
            weight={2}
            opacity={0.9}
            fillOpacity={0.85}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ fontSize: '0.85rem', color: '#1e3a5f' }}>{c.title}</strong>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0' }}>
                  📍 {c.location.address || 'Location on map'}
                </p>
                <p style={{ fontSize: '0.72rem' }}>
                  <span style={{
                    background: PRIORITY_COLORS[c.priority] + '22',
                    color: PRIORITY_COLORS[c.priority],
                    padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  }}>
                    {c.priority?.toUpperCase()} priority
                  </span>
                </p>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
                  ID: {c.trackingId}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
