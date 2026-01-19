'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Incident, IncidentStatus } from '@/types/incident';
import { cn } from '@/lib/utils';
import { IncidentCard } from './IncidentCard';

interface KanbanColumnProps {
  id: IncidentStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  incidents: Incident[];
}

export function KanbanColumn({ id, title, icon, color, incidents }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-gray-50 rounded-xl border-t-4 min-h-[500px] transition-colors duration-200',
        color,
        isOver && 'bg-gray-100 ring-2 ring-blue-400 ring-opacity-50'
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{icon}</span>
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">
            {incidents.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {incidents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No incidents
          </div>
        ) : (
          incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </div>
    </div>
  );
}
