import React, { useState } from 'react';
import {
  X,
  Phone,
  Radio,
  MapPin,
  ExternalLink,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';
import { SosAlert, AlertStatus } from '../types/sos';

interface IncidentDrawerProps {
  alert: SosAlert | null;
  onClose: () => void;
  onUpdateStatus: (alertId: string, status: AlertStatus, note?: string) => Promise<void>;
  onAddNote: (alertId: string, message: string, action?: 'NOTE' | 'DISPATCH') => Promise<void>;
}

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({
  alert,
  onClose,
  onUpdateStatus,
  onAddNote,
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const note = noteInput.trim() || 'Distress beacon acknowledged. Coast Guard patrol vessel dispatched.';
      await onUpdateStatus(alert.id, 'ACKNOWLEDGED', note);
      setNoteInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to acknowledge alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const note = noteInput.trim() || 'Vessel crew safely rescued and escorted to port. Incident resolved.';
      await onUpdateStatus(alert.id, 'RESOLVED', note);
      setNoteInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resolve incident');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      await onAddNote(alert.id, noteInput.trim(), 'NOTE');
      setNoteInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const gmapsUrl = `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-marine-900 border-l border-marine-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-marine-800 flex items-center justify-between bg-marine-950/70">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
            Emergency Incident Detail
          </div>
          <div className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{alert.boatId || 'UNREGISTERED VESSEL'}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold ${
                alert.status === 'ACTIVE'
                  ? 'bg-emergency-crimson/20 text-emergency-crimson border border-emergency-crimson/40 animate-pulse'
                  : alert.status === 'ACKNOWLEDGED'
                  ? 'bg-warning-amber/20 text-warning-amber border border-warning-amber/40'
                  : 'bg-radar-green/20 text-radar-lime border border-radar-green/40'
              }`}
            >
              {alert.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-marine-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMessage && (
        <div className="m-3 p-2.5 rounded bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Vessel & Fisherman Card */}
        <div className="bg-marine-950 rounded-xl p-3.5 border border-marine-800 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vessel & Master Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-slate-500">Master / Operator</div>
              <div className="font-semibold text-slate-200">{alert.fishermanName}</div>
              <div className="text-[11px] text-slate-400">@{alert.username}</div>
            </div>
            <div>
              <div className="text-slate-500">Vessel Registration</div>
              <div className="font-mono font-bold text-slate-200">{alert.boatId || 'N/A'}</div>
            </div>
          </div>

          {/* Direct Phone Dial Button */}
          {alert.contact && (
            <div className="pt-2">
              <a
                href={`tel:${alert.contact}`}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Master: {alert.contact}</span>
              </a>
            </div>
          )}
        </div>

        {/* GPS Coordinates & Position */}
        <div className="bg-marine-950 rounded-xl p-3.5 border border-marine-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Beacon GPS Coordinates</span>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-sans"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-200">
            <MapPin className="w-4 h-4 text-emergency-crimson shrink-0" />
            <span>
              {alert.latitude.toFixed(5)}°, {alert.longitude.toFixed(5)}°
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Recorded at: {alert.timestamp ? new Date(alert.timestamp).toUTCString() : 'Unknown'}
          </div>
        </div>

        {/* Radio Mayday Watch Protocol */}
        <div className="bg-amber-950/20 border border-amber-600/40 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-warning-amber">
            <Radio className="w-4 h-4" />
            <span>RADIO PROTOCOL: VHF CH 16 (156.8 MHz)</span>
          </div>
          <p className="text-amber-200/80 text-[11px] leading-relaxed">
            Hail vessel on VHF Channel 16. Broadcast Urgent Marine Information Broadcast (UMIB) to vessels in sea area.
          </p>
        </div>

        {/* Primary Action Controls */}
        <div className="bg-marine-950 rounded-xl p-3.5 border border-marine-800 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Incident Response Actions
          </div>

          {alert.status === 'ACTIVE' && (
            <button
              onClick={handleAcknowledge}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-warning-amber hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Compass className="w-4 h-4" />
              <span>Acknowledge & Dispatch Rescue</span>
            </button>
          )}

          {alert.status === 'ACKNOWLEDGED' && (
            <button
              onClick={handleResolve}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-radar-green hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Operation Resolved</span>
            </button>
          )}

          {alert.status === 'RESOLVED' && (
            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-600/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-radar-lime" />
              <span>Operation concluded. Handled by {alert.handledByName || 'Command'}.</span>
            </div>
          )}

          {/* Add Operational Note Form */}
          <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-marine-800">
            <label className="text-[11px] font-medium text-slate-400 block">
              Operational Note / Dispatch Log:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Patrol Craft P-412 deployed on 145°..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                disabled={actionLoading}
                className="flex-1 bg-marine-900 border border-marine-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={actionLoading || !noteInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </div>
          </form>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-marine-950 rounded-xl p-3.5 border border-marine-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Chronological Audit Trail ({alert.notes?.length || 0})</span>
          </div>

          <div className="space-y-2.5 border-l border-marine-800 pl-3 ml-1.5">
            {(!alert.notes || alert.notes.length === 0) ? (
              <div className="text-[11px] text-slate-500">No notes recorded yet.</div>
            ) : (
              alert.notes.map((note, index) => (
                <div key={note.id || index} className="relative space-y-1">
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-marine-950" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">
                      {note.authorName}
                      <span className="text-[10px] ml-1.5 px-1 py-0.2 rounded bg-marine-800 text-blue-300 uppercase font-mono">
                        {note.action}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {note.timestamp ? new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-marine-900/60 p-2 rounded border border-marine-800/60">
                    {note.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
