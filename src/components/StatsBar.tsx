import React from 'react';
import { AlertTriangle, Compass, CheckCircle2, Waves } from 'lucide-react';
import { ResponderStats } from '../types/sos';

interface StatsBarProps {
  stats: ResponderStats;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-marine-950/60 border-b border-marine-800">
      {/* 1. Active Alerts */}
      <button
        onClick={() => onSelectFilter(selectedFilter === 'active' ? 'all' : 'active')}
        className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
          selectedFilter === 'active'
            ? 'bg-emergency-crimson/20 border-emergency-crimson text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            : 'bg-marine-900/70 border-marine-800 hover:border-emergency-crimson/40 text-slate-300'
        }`}
      >
        <div className={`p-2 rounded-lg ${stats.activeCount > 0 ? 'bg-emergency-crimson text-white animate-pulse' : 'bg-marine-800 text-slate-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Distress
          </div>
          <div className="text-xl font-bold font-mono text-emergency-crimson flex items-center gap-1.5">
            {stats.activeCount}
            {stats.activeCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 font-sans font-medium">
                IMMEDIATE
              </span>
            )}
          </div>
        </div>
      </button>

      {/* 2. Operations Underway / Acknowledged */}
      <button
        onClick={() => onSelectFilter(selectedFilter === 'acknowledged' ? 'all' : 'acknowledged')}
        className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
          selectedFilter === 'acknowledged'
            ? 'bg-warning-amber/20 border-warning-amber text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-marine-900/70 border-marine-800 hover:border-warning-amber/40 text-slate-300'
        }`}
      >
        <div className="p-2 rounded-lg bg-warning-amber/20 text-warning-amber">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Underway Dispatch
          </div>
          <div className="text-xl font-bold font-mono text-warning-amber">
            {stats.acknowledgedCount}
          </div>
        </div>
      </button>

      {/* 3. Resolved Today */}
      <button
        onClick={() => onSelectFilter(selectedFilter === 'resolved' ? 'all' : 'resolved')}
        className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
          selectedFilter === 'resolved'
            ? 'bg-radar-green/20 border-radar-green text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : 'bg-marine-900/70 border-marine-800 hover:border-radar-green/40 text-slate-300'
        }`}
      >
        <div className="p-2 rounded-lg bg-radar-green/20 text-radar-lime">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Resolved Today
          </div>
          <div className="text-xl font-bold font-mono text-radar-lime">
            {stats.resolvedTodayCount}
          </div>
        </div>
      </button>

      {/* 4. Total Monitored Incidents */}
      <button
        onClick={() => onSelectFilter('all')}
        className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
          selectedFilter === 'all'
            ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
            : 'bg-marine-900/70 border-marine-800 hover:border-blue-500/40 text-slate-300'
        }`}
      >
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
          <Waves className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Open
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {stats.totalOpen}
          </div>
        </div>
      </button>
    </div>
  );
};
