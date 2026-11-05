import React, { useState, useEffect } from 'react';
import { Shield, Radio, Volume2, VolumeX, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  sirenEnabled: boolean;
  onToggleSiren: () => void;
  activeAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  sirenEnabled,
  onToggleSiren,
  activeAlertCount,
}) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState({
    utc: '',
    local: '',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        utc: now.toUTCString().slice(17, 25) + ' UTC',
        local: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' LOCAL',
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-marine-700/60 bg-marine-900/95 backdrop-blur px-4 py-2.5 sticky top-0 z-30 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Station Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center border border-blue-400/30 shadow-inner">
            <Shield className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-sm sm:text-base text-white uppercase">
                Maritime Rescue Coordination Centre
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-blue-900/60 text-blue-300 border border-blue-500/30">
                MRCC COLOMBO
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-radar-lime">
                <span className="w-2 h-2 rounded-full bg-radar-lime animate-pulse" />
                VHF CH 16 (156.8 MHz) • EPIRB 406 MHz WATCH
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live UTC/Local Clocks & Emergency Pill */}
        <div className="hidden lg:flex items-center gap-4 bg-marine-950/80 px-3 py-1.5 rounded-lg border border-marine-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{time.utc}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{time.local}</span>
          </div>
          {activeAlertCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emergency-crimson/20 border border-emergency-crimson/50 text-red-400 font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>{activeAlertCount} DISTRESS ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-radar-green/10 border border-radar-green/30 text-radar-lime font-medium">
              <span>ALL CLEAR</span>
            </div>
          )}
        </div>

        {/* Right: Siren Toggle & User Actions */}
        <div className="flex items-center gap-2.5">
          {/* Siren Button */}
          <button
            onClick={onToggleSiren}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              sirenEnabled
                ? 'bg-emergency-crimson/20 text-red-300 border-emergency-crimson/40 hover:bg-emergency-crimson/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'bg-marine-800 text-slate-400 border-marine-700 hover:text-slate-200'
            }`}
            title={sirenEnabled ? 'Distress siren is enabled (click to silence)' : 'Click to enable audio siren alarms'}
          >
            {sirenEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="hidden sm:inline">SIREN ARMED</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">ENABLE SIREN</span>
              </>
            )}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-marine-700">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-medium text-slate-200">{user?.username}</div>
              <div className="text-[10px] text-blue-400 font-mono uppercase tracking-wider">
                {user?.role || 'COAST GUARD'}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-marine-800 text-slate-400 hover:text-red-400 hover:bg-marine-700 border border-marine-700 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
