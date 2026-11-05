import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AlertFeed } from './components/AlertFeed';
import { MapView } from './components/MapView';
import { IncidentDrawer } from './components/IncidentDrawer';
import { SosAlert, ResponderStats, AlertStatus } from './types/sos';
import { api, sosSocketUrl } from './services/api';

const emptyStats: ResponderStats = {
  activeCount: 0, acknowledgedCount: 0, resolvedTodayCount: 0, totalOpen: 0,
};

const newestFirst = (a: SosAlert, b: SosAlert) => b.id.localeCompare(a.id);

export const App: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);
  const [stats, setStats] = useState<ResponderStats>(emptyStats);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sirenEnabled, setSirenEnabled] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenEnabledRef = useRef(false);
  const knownActiveIds = useRef<Set<string>>(new Set());
  const snapshot = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const selectedId = useRef<string | null>(null);
  const selectAlert = useCallback((alert: SosAlert | null) => {
    selectedId.current = alert?.id ?? null;
    setSelectedAlert(alert);
  }, []);

  // Web Audio Siren Generator
  const playSiren = useCallback((confirmation = false) => {
    const ctx = audioCtxRef.current;
    if (!sirenEnabledRef.current || !ctx || ctx.state !== 'running') return;
    try {
      const now = ctx.currentTime;
      const tones = confirmation ? [{ freq: 659.25, start: 0, dur: 0.15 }] : [
        { freq: 880, start: 0, dur: 0.25 },
        { freq: 587.33, start: 0.25, dur: 0.25 },
        { freq: 880, start: 0.5, dur: 0.25 },
        { freq: 587.33, start: 0.75, dur: 0.25 },
      ];
      tones.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = confirmation ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(confirmation ? 0.1 : 0.18, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (_) { setAudioError(true); }
  }, []);

  const toggleSiren = async () => {
    setAudioError(false);
    if (sirenEnabledRef.current) {
      sirenEnabledRef.current = false;
      setSirenEnabled(false);
      return;
    }
    const token = api.getToken();
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      await ctx.resume();
      if (!token || token !== api.getToken()) return;
      if (ctx.state !== 'running') throw new Error('Audio could not start');
      sirenEnabledRef.current = true;
      setSirenEnabled(true);
      playSiren(true);
    } catch (_) {
      if (token === api.getToken()) setAudioError(true);
    }
  };

  const announceNewActive = useCallback((items: SosAlert[]) => {
    let hasNew = false;
    for (const alert of items) {
      if (alert.status !== 'ACTIVE' || knownActiveIds.current.has(alert.id)) continue;
      knownActiveIds.current.add(alert.id);
      hasNew = true;
    }
    if (hasNew) playSiren();
  }, [playSiren]);

  const applyAlert = useCallback((alert: SosAlert) => {
    revision.current++;
    setAlerts((previous) => {
      const existing = previous.find((item) => item.id === alert.id);
      if (existing && existing.notes.length > alert.notes.length) return previous;
      return [alert, ...previous.filter((item) => item.id !== alert.id)].sort(newestFirst);
    });
    setSelectedAlert((previous) => previous?.id === alert.id && previous.notes.length <= alert.notes.length
      ? { ...previous, ...alert } : previous);
  }, []);

  const fetchData = useCallback(async (showLoading = false) => {
    const token = api.getToken();
    if (!token || snapshot.current) return;
    const controller = new AbortController();
    snapshot.current = controller;
    const requestedAt = revision.current;
    const timeout = setTimeout(() => controller.abort(), 20000);
    if (showLoading) setLoading(true);
    try {
      const { signal } = controller;
      const [recent, open, newStats] = await Promise.all([
        api.getAlerts('all', 50, undefined, signal),
        api.getOpenAlerts(signal),
        api.getStats(signal),
      ]);
      const byId = new Map(recent.items.filter((alert) => alert.isHandled).map((alert) => [alert.id, alert]));
      for (const alert of open) byId.set(alert.id, alert);
      const id = selectedId.current;
      const selected = id ? byId.get(id) ?? await api.getAlertById(id, signal) : null;
      if (snapshot.current !== controller || token !== api.getToken()) return;
      // A socket event or mutation that arrived during the read is newer than this snapshot.
      if (revision.current === requestedAt) {
        const items = [...byId.values()].sort(newestFirst);
        announceNewActive(open);
        setAlerts(items);
        setStats(newStats);
        setSelectedAlert((previous) => {
          if (!previous) return null;
          return (selected?.id === previous.id ? selected : byId.get(previous.id)) ?? previous;
        });
      }
      setRefreshError(false);
    } catch (_) {
      if (snapshot.current === controller && token === api.getToken()) setRefreshError(true);
    } finally {
      clearTimeout(timeout);
      controller.abort();
      if (snapshot.current === controller) {
        snapshot.current = null;
        if (showLoading) setLoading(false);
      }
    }
  }, [announceNewActive]);

  useEffect(() => {
    if (!isAuthenticated) {
      knownActiveIds.current.clear();
      sirenEnabledRef.current = false;
      setSirenEnabled(false);
      setAudioError(false);
      setRefreshError(false);
      setLoading(false);
      setAlerts([]);
      setStats(emptyStats);
      selectAlert(null);
      return;
    }
    void fetchData(true);
    const interval = setInterval(() => { void fetchData(); }, 5000);
    return () => {
      clearInterval(interval);
      snapshot.current?.abort();
      snapshot.current = null;
    };
  }, [isAuthenticated, fetchData, selectAlert]);

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
      try {
        ws = new WebSocket(sosSocketUrl());

        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'auth', token }));
        };

        ws.onmessage = (event) => {
          if (isDisposed || token !== api.getToken()) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ready') {
              void fetchData();
            } else if (['sos.created', 'sos.updated', 'sos.cancelled'].includes(data.type) && data.alert?.id) {
              applyAlert(data.alert);
              if (data.type === 'sos.created') announceNewActive([data.alert]);
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
  }, [isAuthenticated, announceNewActive, applyAlert, fetchData]);

  // Action Handlers for Incident Drawer
  const handleUpdateStatus = async (alertId: string, status: AlertStatus, note?: string) => {
    const token = api.getToken();
    const updated = await api.updateStatus(alertId, status, note);
    if (token === api.getToken()) {
      applyAlert(updated);
      void fetchData();
    }
  };

  const handleAddNote = async (alertId: string, message: string, action: 'NOTE' | 'DISPATCH' = 'NOTE') => {
    const token = api.getToken();
    const updated = await api.addNote(alertId, message, action);
    if (token === api.getToken()) {
      applyAlert(updated);
      void fetchData();
    }
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

      {refreshError && <p role="alert" className="px-4 py-2 bg-red-950 text-red-200 text-sm">
        Could not refresh incidents. The displayed information may be out of date.
      </p>}
      {audioError && <p role="alert" className="px-4 py-2 bg-amber-950 text-amber-200 text-sm">
        The browser could not play the distress alarm. Try enabling audio again.
      </p>}

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
            onSelectAlert={selectAlert}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            loading={loading}
            onRefresh={() => { void fetchData(true); }}
          />
        </div>

        {/* Center/Right: Interactive Map */}
        <div className="flex-1 h-[60vh] md:h-auto relative">
          <MapView
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={selectAlert}
          />
        </div>

        {/* Incident Detail Slide-Over Drawer */}
        {selectedAlert && (
          <IncidentDrawer
            key={selectedAlert.id}
            alert={selectedAlert}
            onClose={() => selectAlert(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddNote={handleAddNote}
          />
        )}
      </div>
    </div>
  );
};
