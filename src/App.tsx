import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AlertFeed } from './components/AlertFeed';
import { MapView } from './components/MapView';
import { IncidentDrawer } from './components/IncidentDrawer';
import { SosAlert, ResponderStats, AlertStatus } from './types/sos';
import { api } from './services/api';

export const App: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);
  const [stats, setStats] = useState<ResponderStats>({
    activeCount: 0,
    acknowledgedCount: 0,
    resolvedTodayCount: 0,
    totalOpen: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sirenEnabled, setSirenEnabled] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const knownActiveIds = useRef<Set<string>>(new Set());

  // Web Audio Siren Generator
  const playSiren = useCallback(() => {
    if (!sirenEnabled) return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High-low 2-tone maritime distress alarm
      [
        { freq: 880, start: 0, dur: 0.25 },
        { freq: 587.33, start: 0.25, dur: 0.25 },
        { freq: 880, start: 0.5, dur: 0.25 },
        { freq: 587.33, start: 0.75, dur: 0.25 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.18, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (_) {}
  }, [sirenEnabled]);

  const toggleSiren = () => {
    if (!sirenEnabled) {
      try {
        const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();

        // Brief chime to unlock audio context and confirm activation
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        setSirenEnabled(true);
      } catch (_) {
        setSirenEnabled(true);
      }
    } else {
      setSirenEnabled(false);
    }
  };

  // Fetch Data Function (used on mount & 5s polling safety net)
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [alertsRes, statsRes] = await Promise.all([
        api.getAlerts('all', 50),
        api.getStats(),
      ]);

      const items = alertsRes.items || [];
      setAlerts(items);
      setStats(statsRes);

      // Check for newly arrived ACTIVE alerts to trigger siren
      let hasNewActive = false;
      const currentActiveIds = new Set<string>();

      items.forEach((a) => {
        if (a.status === 'ACTIVE') {
          currentActiveIds.add(a.id);
          if (!knownActiveIds.current.has(a.id)) {
            hasNewActive = true;
          }
        }
      });

      if (hasNewActive && knownActiveIds.current.size > 0) {
        playSiren();
      }
      knownActiveIds.current = currentActiveIds;

      // Update selected alert if open
      if (selectedAlert) {
        const updated = items.find((a) => a.id === selectedAlert.id);
        if (updated) setSelectedAlert(updated);
      }
    } catch (_) {}
  }, [isAuthenticated, selectedAlert, playSiren]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // 5-second polling interval (fail-safe safety net)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  // Real-time WebSocket connection to backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = api.getToken();
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connectWs = () => {
      if (isDisposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/messages/socket`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'auth', token }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'sos.created') {
              playSiren();
              setAlerts((prev) => [data.alert, ...prev.filter((a) => a.id !== data.alert.id)]);
              void api.getStats().then(setStats);
            } else if (data.type === 'sos.updated' || data.type === 'sos.cancelled') {
              setAlerts((prev) =>
                prev.map((a) => (a.id === data.alert.id ? { ...a, ...data.alert } : a))
              );
              setSelectedAlert((prev) => (prev?.id === data.alert.id ? { ...prev, ...data.alert } : prev));
              void api.getStats().then(setStats);
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (_) {
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connectWs, 5000);
        }
      }
    };

    connectWs();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isAuthenticated, playSiren]);

  // Action Handlers for Incident Drawer
  const handleUpdateStatus = async (alertId: string, status: AlertStatus, note?: string) => {
    const updated = await api.updateStatus(alertId, status, note);
    setSelectedAlert(updated);
    await fetchData();
  };

  const handleAddNote = async (alertId: string, message: string, action: 'NOTE' | 'DISPATCH' = 'NOTE') => {
    const updated = await api.addNote(alertId, message, action);
    setSelectedAlert(updated);
    await fetchData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-marine-950 flex items-center justify-center text-slate-400 text-xs font-mono">
        INITIALIZING OCEANPULSE COMMAND CONSOLE...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-marine-950 text-slate-100 font-sans">
      {/* 1. Header Bar */}
      <Header
        sirenEnabled={sirenEnabled}
        onToggleSiren={toggleSiren}
        activeAlertCount={stats.activeCount}
      />

      {/* 2. Operational Stats Bar */}
      <StatsBar
        stats={stats}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* 3. Main Dashboard Workspace (Split Feed & Map) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Alert Feed */}
        <div className="w-full md:w-[380px] lg:w-[430px] shrink-0 h-[40vh] md:h-auto border-r border-marine-800">
          <AlertFeed
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={setSelectedAlert}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            loading={loading}
            onRefresh={() => {
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
          />
        </div>

        {/* Center/Right: Interactive Map */}
        <div className="flex-1 h-[60vh] md:h-auto relative">
          <MapView
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={setSelectedAlert}
          />
        </div>

        {/* Incident Detail Slide-Over Drawer */}
        {selectedAlert && (
          <IncidentDrawer
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
          />
        )}
      </div>
    </div>
  );
};
