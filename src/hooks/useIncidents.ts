'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Incident, IncidentStatus } from '@/types/incident';
import { fetchIncidents, subscribeToIncidents, updateIncidentStatus } from '@/lib/incidents';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchIncidents();
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: IncidentStatus) => {
    try {
      // Optimistic update
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === id ? { ...incident, status } : incident
        )
      );

      await updateIncidentStatus(id, status);
    } catch (err) {
      // Revert on error
      await loadIncidents();
      throw err;
    }
  }, [loadIncidents]);

  useEffect(() => {
    loadIncidents();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setIncidents((prev) => [payload.new as Incident, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setIncidents((prev) =>
          prev.map((incident) =>
            incident.id === payload.new?.id ? (payload.new as Incident) : incident
          )
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setIncidents((prev) =>
          prev.filter((incident) => incident.id !== payload.old?.id)
        );
      }
    });

    return unsubscribe;
  }, [loadIncidents]);

  return {
    incidents,
    loading,
    error,
    updateStatus,
    refetch: loadIncidents,
  };
}
