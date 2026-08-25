/**
 * useNotifications.ts
 * Custom hook for fetching and displaying in-app notifications from the
 * admin notifications endpoint, per PRD §25.
 *
 * Usage:
 *   const { notifications, unreadCount, loading, refetch } = useNotifications();
 *
 * Available to Admin and Inspector roles. Non-admin roles see security events
 * relevant to their own batches via their dashboards.
 */

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/client';

export interface Notification {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedEntity: string;
  description: string;
  createdAt: string;
}

interface UseNotificationsOptions {
  /** Auto-poll interval in ms. 0 to disable polling. Default: 30000 (30 seconds) */
  pollInterval?: number;
  limit?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAllRead: () => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { pollInterval = 30000, limit = 20 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<Date>(() => new Date());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.notifications(limit);
      setNotifications(res.data.notifications || []);
    } catch (err: any) {
      // Silently fail if the user doesn't have admin role — notifications are admin-only
      if (err.response?.status !== 403 && err.response?.status !== 401) {
        setError(err.response?.data?.error || err.message || 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Optional polling
  useEffect(() => {
    if (!pollInterval) return;
    const interval = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollInterval]);

  const unreadCount = notifications.filter(
    (n) => new Date(n.createdAt) > lastReadAt
  ).length;

  const markAllRead = useCallback(() => {
    setLastReadAt(new Date());
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAllRead,
  };
}

/** Returns a CSS color class for the severity badge */
export function getSeverityColor(severity: Notification['severity']): string {
  switch (severity) {
    case 'CRITICAL': return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
    case 'HIGH':     return 'text-orange-400 bg-orange-950/60 border-orange-500/40';
    case 'MEDIUM':   return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    case 'LOW':      return 'text-slate-300 bg-slate-800/60 border-slate-600/40';
    default:         return 'text-slate-300 bg-slate-800/60 border-slate-600/40';
  }
}
