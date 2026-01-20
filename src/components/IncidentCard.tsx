'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Clock, AlertTriangle, FolderKanban } from 'lucide-react';
import type { Incident } from '@/types/incident';
import { cn, getImpactColor, getRelativeTime } from '@/lib/utils';
import { IncidentDetailModal } from './KanbanBoard';

interface IncidentCardProps {
  incident: Incident;
  isDragging?: boolean;
}

export function IncidentCard({ incident, isDragging }: IncidentCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: incident.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
          isDragging && 'shadow-lg ring-2 ring-blue-400 opacity-90 rotate-2'
        )}
        onClick={() => setShowDetail(true)}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="flex items-center justify-center py-1 border-b border-gray-100 cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-t-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Card Content */}
        <div className="p-3 space-y-2">
          {/* Project Name Badge */}
          {incident.project_name && (
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                {incident.project_name}
              </span>
            </div>
          )}

          {/* Incident ID */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {incident.incident_id}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border',
              getImpactColor(incident.impact)
            )}>
              {incident.impact || 'Unknown'}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 line-clamp-2">
            {incident.description || 'No description'}
          </p>

          {/* Type Badge */}
          {incident.incident_type && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{incident.incident_type}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{incident.pic || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{getRelativeTime(incident.waktu_chat)}</span>
            </div>
          </div>
        </div>
      </div>

      <IncidentDetailModal
        incident={incident}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}
