export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';

export type NoteAction = 'CREATED' | 'ACKNOWLEDGE' | 'DISPATCH' | 'NOTE' | 'RESOLVE' | 'CANCEL';

export interface AlertNote {
  id?: string;
  message: string;
  authorId?: string | null;
  authorName: string;
  action: NoteAction;
  timestamp: string | null;
}

export interface SosAlert {
  id: string;
  userId: string;
  username: string;
  fishermanName: string;
  contact: string;
  boatId: string;
  latitude: number;
  longitude: number;
  timestamp: string | null;
  status: AlertStatus;
  isHandled: boolean;
  handledBy?: string | null;
  handledByName?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  cancelledAt?: string | null;
  notes: AlertNote[];
  latestBoatLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated?: string;
  } | null;
}

export interface ResponderStats {
  activeCount: number;
  acknowledgedCount: number;
  resolvedTodayCount: number;
  totalOpen: number;
}

export interface CoastGuardUser {
  userId: string;
  username: string;
  email?: string;
  role: 'coastguard' | 'admin' | 'fisherman';
  firstName?: string;
  lastName?: string;
}
