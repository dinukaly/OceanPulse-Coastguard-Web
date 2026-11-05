import { SosAlert, ResponderStats, CoastGuardUser, AlertStatus, NoteAction } from '../types/sos';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const sosSocketUrl = () => {
  const url = new URL(`${BASE_URL}/api/v1/messages/socket`, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href;
};

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('op_cg_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('op_cg_token', token);
    } else {
      localStorage.removeItem('op_cg_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  async login(email: string, password: string): Promise<{ token: string; user: CoastGuardUser }> {
    const response = await this.request<{
      success: boolean;
      data: { token: string; user: CoastGuardUser };
    }>('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response.data;
  }

  async getAlerts(
    status: string = 'all',
    limit: number = 50,
    before?: string,
    signal?: AbortSignal,
  ): Promise<{ items: SosAlert[]; hasMore: boolean; nextCursor: string | null }> {
    const params = new URLSearchParams();
    if (status === 'open') params.append('isHandled', 'false');
    else if (status && status !== 'all') params.append('status', status);
    if (limit) params.append('limit', String(limit));
    if (before) params.append('before', before);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{
      success: boolean;
      data: SosAlert[];
      pagination?: { limit: number; hasMore: boolean; nextCursor: string | null };
    }>(`/api/v1/sosAlerts/responder/alerts${query}`, { signal });

    return {
      items: response.data || [],
      hasMore: response.pagination?.hasMore || false,
      nextCursor: response.pagination?.nextCursor || null,
    };
  }

  async getOpenAlerts(signal: AbortSignal): Promise<SosAlert[]> {
    const alerts: SosAlert[] = [];
    let before: string | undefined;
    do {
      const page = await this.getAlerts('open', 50, before, signal);
      alerts.push(...page.items);
      if (!page.hasMore) return alerts;
      if (!page.nextCursor || (before && page.nextCursor >= before)) throw new Error('Invalid open alert cursor');
      before = page.nextCursor;
    } while (!signal.aborted);
    signal.throwIfAborted();
    return alerts;
  }

  async getAlertById(alertId: string, signal?: AbortSignal): Promise<SosAlert> {
    const response = await this.request<{
      success: boolean;
      data: SosAlert;
    }>(`/api/v1/sosAlerts/responder/alerts/${alertId}`, { signal });

    return response.data;
  }

  async updateStatus(alertId: string, status: AlertStatus, note?: string): Promise<SosAlert> {
    const response = await this.request<{
      success: boolean;
      data: SosAlert;
    }>(`/api/v1/sosAlerts/responder/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });

    return response.data;
  }

  async addNote(alertId: string, message: string, action: NoteAction = 'NOTE'): Promise<SosAlert> {
    const response = await this.request<{
      success: boolean;
      data: SosAlert;
    }>(`/api/v1/sosAlerts/responder/alerts/${alertId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ message, action }),
    });

    return response.data;
  }

  async getStats(signal?: AbortSignal): Promise<ResponderStats> {
    const response = await this.request<{
      success: boolean;
      data: ResponderStats;
    }>('/api/v1/sosAlerts/responder/stats', { signal });

    return (
      response.data || {
        activeCount: 0,
        acknowledgedCount: 0,
        resolvedTodayCount: 0,
        totalOpen: 0,
      }
    );
  }
}

export const api = new ApiService();
