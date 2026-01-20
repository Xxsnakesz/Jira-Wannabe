'use client';

import { createClient } from '@/lib/supabase/client';
import type { Incident, IncidentStatus } from '@/types/incident';

const supabase = createClient();

export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }

  return data as Incident[];
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus
): Promise<Incident> {
  console.log('updateIncidentStatus called:', { id, status });
  
  const response = await fetch(`/api/incidents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  console.log('API response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('API error:', error);
    throw new Error(error.error || 'Failed to update incident');
  }

  const result = await response.json();
  console.log('API result:', result);
  return result.data;
}

export function subscribeToIncidents(
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Incident | null;
    old: Incident | null;
  }) => void
) {
  const channel = supabase
    .channel('incidents-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incidents',
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Incident | null,
          old: payload.old as Incident | null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
