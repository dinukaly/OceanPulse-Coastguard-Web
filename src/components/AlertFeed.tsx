import React, { useState } from 'react';
import { AlertTriangle, Clock, Ship, Phone, ChevronRight, Search, ShieldAlert } from 'lucide-react';
import { SosAlert, AlertStatus } from '../types/sos';

interface AlertFeedProps {
  alerts: SosAlert[];
  selectedAlert: SosAlert | null;
  onSelectAlert: (alert: SosAlert) => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

function getTimeElapsed(dateStr: string | null): { text: string; minutes: number } {
  if (!dateStr) return { text: 'Unknown', minutes: 0 };
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return { text: 'Just now', minutes: 0 };
  if (minutes < 60) return { text: `${minutes}m ago`, minutes };
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return { text: `${hours}h ${remMinutes}m ago`, minutes };
}

function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emergency-crimson/20 text-emergency-crimson border border-emergency-crimson/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emergency-crimson" />
          ACTIVE
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-warning-amber/20 text-warning-amber border border-warning-amber/40">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-amber" />
          ACKNOWLEDGED
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-radar-green/20 text-radar-lime border border-radar-green/40">
          <span className="w-1.5 h-1.5 rounded-full bg-radar-green" />
          RESOLVED
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          CANCELLED
        </span>
      );
    default:
      return null;
  }
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  selectedAlert,
  onSelectAlert,
  selectedFilter,
  onSelectFilter,
  loading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    // Status filter
    if (selectedFilter === 'active' && alert.status !== 'ACTIVE') return false;
    if (selectedFilter === 'acknowledged' && alert.status !== 'ACKNOWLEDGED') return false;
    if (selectedFilter === 'resolved' && alert.status !== 'RESOLVED') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchBoat = alert.boatId?.toLowerCase().includes(q);
      const matchName = alert.fishermanName?.toLowerCase().includes(q);
      const matchPhone = alert.contact?.toLowerCase().includes(q);
      const matchUser = alert.username?.toLowerCase().includes(q);
      return matchBoat || matchName || matchPhone || matchUser;
    }

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-marine-900 border-r border-marine-800">
      {/* Header & Filter Tabs */}
      <div className="p-3 border-b border-marine-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
              Incident Stream
            </h2>
            <span className="px-1.5 py-0.2 rounded-full bg-marine-800 text-xs font-mono text-slate-300">
              {filteredAlerts.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Vessel ID, Name, Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-marine-950 border border-marine-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active SOS' },
            { id: 'acknowledged', label: 'Acknowledged' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md font-medium text-xs whitespace-nowrap transition ${
                selectedFilter === tab.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-marine-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {loading ? 'Loading incidents...' : 'No emergency distress signals in this view.'}
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isSelected = selectedAlert?.id === alert.id;
            const { text: elapsedText, minutes } = getTimeElapsed(alert.timestamp);
            const isOverdue = alert.status === 'ACTIVE' && minutes >= 5;

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-3 rounded-xl border cursor-pointer transition relative group ${
                  isSelected
                    ? 'bg-marine-800 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : isOverdue
                    ? 'bg-red-950/25 border-emergency-crimson/80 hover:bg-red-950/40 animate-pulse'
                    : alert.status === 'ACTIVE'
                    ? 'bg-marine-900/90 border-emergency-crimson/40 hover:border-emergency-crimson'
                    : alert.status === 'ACKNOWLEDGED'
                    ? 'bg-marine-900/90 border-warning-amber/30 hover:border-warning-amber/60'
                    : 'bg-marine-950/80 border-marine-800 hover:border-marine-700'
                }`}
              >
                {/* Header Row: Vessel ID + Status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-sm text-slate-100 font-mono tracking-wide">
                      {alert.boatId || 'UNREGISTERED'}
                    </span>
                  </div>
                  <div>{getStatusBadge(alert.status)}</div>
                </div>

                {/* Overdue Alert Warning Banner */}
                {isOverdue && (
                  <div className="mb-2 px-2 py-0.5 rounded bg-emergency-crimson/20 border border-emergency-crimson text-red-300 text-[10px] font-bold flex items-center gap-1 tracking-wider uppercase">
                    <ShieldAlert className="w-3.5 h-3.5 text-emergency-crimson" />
                    CRITICAL: UNACKNOWLEDGED FOR {minutes} MINS
                  </div>
                )}

                {/* Fisherman Name & Coordinates */}
                <div className="text-xs text-slate-300 font-medium mb-1 truncate">
                  {alert.fishermanName}
                  <span className="text-slate-500 ml-1">(@{alert.username})</span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  {formatCoordinates(alert.latitude, alert.longitude)}
                </div>

                {/* Footer: Time + Contact Quick Trigger */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-marine-800/80 text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{elapsedText}</span>
                  </div>

                  {alert.contact && (
                    <a
                      href={`tel:${alert.contact}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono text-[11px]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{alert.contact}</span>
                    </a>
                  )}

                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
