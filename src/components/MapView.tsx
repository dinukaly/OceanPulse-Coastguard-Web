import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SosAlert } from '../types/sos';

interface MapViewProps {
  alerts: SosAlert[];
  selectedAlert: SosAlert | null;
  onSelectAlert: (alert: SosAlert) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  alerts,
  selectedAlert,
  onSelectAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over Sri Lanka coastal maritime zone
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark high-contrast nautical theme tiles (CartoDB Dark Matter or OpenStreetMap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap © CARTO' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const alertIds = new Set(alerts.map((a) => a.id));

    // Remove old markers
    for (const [id, marker] of currentMarkers.entries()) {
      if (!alertIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    alerts.forEach((alert) => {
      if (!Number.isFinite(alert.latitude) || !Number.isFinite(alert.longitude)) return;

      const isSelected = selectedAlert?.id === alert.id;
      const isUrgent = alert.status === 'ACTIVE';
      const isAck = alert.status === 'ACKNOWLEDGED';

      // Pin Color & Icon style
      let pinColor = '#10B981'; // Green for resolved
      let rippleClass = '';

      if (isUrgent) {
        pinColor = '#EF4444';
        rippleClass = 'animate-ping-slow bg-red-500/40';
      } else if (isAck) {
        pinColor = '#F59E0B';
        rippleClass = 'bg-amber-500/30';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isUrgent ? `<div class="absolute w-10 h-10 rounded-full ${rippleClass} pointer-events-none"></div>` : ''}
          <div class="relative z-10 flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 ${
            isSelected ? 'border-white scale-125' : 'border-slate-900'
          }" style="background-color: ${pinColor};">
            <span class="text-white text-xs font-bold font-mono">
              ${isUrgent ? 'SOS' : isAck ? '⚡' : '✓'}
            </span>
          </div>
          <div class="absolute -bottom-6 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-slate-200 border border-slate-700 whitespace-nowrap shadow pointer-events-none group-hover:block ${
            isSelected ? 'block' : 'hidden'
          }">
            ${alert.boatId || alert.fishermanName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-beacon-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const existingMarker = currentMarkers.get(alert.id);
      if (existingMarker) {
        existingMarker.setLatLng([alert.latitude, alert.longitude]);
        existingMarker.setIcon(customIcon);
      } else {
        const marker = L.marker([alert.latitude, alert.longitude], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          onSelectAlert(alert);
        });

        currentMarkers.set(alert.id, marker);
      }
    });
  }, [alerts, selectedAlert, onSelectAlert]);

  // Center on selected alert
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAlert) return;
    if (Number.isFinite(selectedAlert.latitude) && Number.isFinite(selectedAlert.longitude)) {
      mapInstanceRef.current.flyTo([selectedAlert.latitude, selectedAlert.longitude], 10, {
        duration: 1.2,
      });
    }
  }, [selectedAlert]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-marine-950 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-marine-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-marine-700/80 shadow-xl text-xs space-y-1.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Maritime Beacon Status
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emergency-crimson animate-pulse" />
          <span className="text-slate-200">Active Distress (Unacknowledged)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-warning-amber" />
          <span className="text-slate-200">Rescue Underway (Dispatched)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-radar-green" />
          <span className="text-slate-200">Resolved / Escorted</span>
        </div>
      </div>
    </div>
  );
};
