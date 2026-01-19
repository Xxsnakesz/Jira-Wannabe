'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Archive,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types/incident';
import { cn, getImpactColor, getRelativeTime, formatDate } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { IncidentCard } from './IncidentCard';

interface KanbanBoardProps {
  incidents: Incident[];
  onStatusChange: (id: string, status: IncidentStatus) => Promise<void>;
}

const COLUMNS: { id: IncidentStatus; title: string; icon: React.ReactNode; color: string }[] = [
  { 
    id: 'New', 
    title: 'New', 
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'border-t-blue-500',
  },
  { 
    id: 'In Progress', 
    title: 'In Progress', 
    icon: <Clock className="w-4 h-4" />,
    color: 'border-t-yellow-500',
  },
  { 
    id: 'Resolved', 
    title: 'Resolved', 
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'border-t-green-500',
  },
  { 
    id: 'Closed', 
    title: 'Closed', 
    icon: <Archive className="w-4 h-4" />,
    color: 'border-t-gray-500',
  },
];

export function KanbanBoard({ incidents, onStatusChange }: KanbanBoardProps) {
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const groupedIncidents = useMemo(() => {
    const groups: Record<IncidentStatus, Incident[]> = {
      'New': [],
      'In Progress': [],
      'Resolved': [],
      'Closed': [],
    };

    incidents.forEach((incident) => {
      const status = incident.status as IncidentStatus;
      if (groups[status]) {
        groups[status].push(incident);
      }
    });

    return groups;
  }, [incidents]);

  const handleDragStart = (event: DragStartEvent) => {
    const incident = incidents.find((i) => i.id === event.active.id);
    setActiveIncident(incident || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIncident(null);

    if (!over) return;

    const incidentId = active.id as string;
    const newStatus = over.id as IncidentStatus;
    
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident || incident.status === newStatus) return;

    try {
      await onStatusChange(incidentId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            icon={column.icon}
            color={column.color}
            incidents={groupedIncidents[column.id]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIncident && (
          <IncidentCard incident={activeIncident} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Detail Modal Component
interface IncidentDetailModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentDetailModal({ incident, isOpen, onClose }: IncidentDetailModalProps) {
  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-gray-500">Incident ID</span>
            <h2 className="text-xl font-bold text-gray-900">{incident.incident_id}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border',
              getImpactColor(incident.impact)
            )}>
              {incident.impact || 'Unknown'} Impact
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {incident.incident_type || 'Unknown'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Description</span>
            <p className="text-gray-700 mt-1">{incident.description || 'No description provided'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{incident.pic || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{incident.phone_number || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <Calendar className="w-4 h-4" />
              <span>Occurred: {formatDate(incident.waktu_kejadian)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 pt-4 border-t">
            Reported {getRelativeTime(incident.waktu_chat)}
          </div>
        </div>
      </div>
    </div>
  );
}
