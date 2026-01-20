'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  X,
  FolderKanban,
} from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types/incident';
import { cn, formatDate, getImpactColor, getStatusColor, getRelativeTime } from '@/lib/utils';

interface DataTableProps {
  incidents: Incident[];
  onStatusChange: (id: string, status: IncidentStatus) => Promise<void>;
}

type SortField = 'incident_id' | 'project_name' | 'status' | 'impact' | 'waktu_kejadian' | 'waktu_chat';
type SortDirection = 'asc' | 'desc';

const STATUS_OPTIONS: IncidentStatus[] = ['New', 'In Progress', 'Resolved', 'Closed'];

export function DataTable({ incidents, onStatusChange }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('waktu_chat');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredAndSortedIncidents = useMemo(() => {
    let result = [...incidents];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (incident) =>
          incident.incident_id.toLowerCase().includes(searchLower) ||
          incident.description?.toLowerCase().includes(searchLower) ||
          incident.pic?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((incident) => incident.status === statusFilter);
    }

    // Impact filter
    if (impactFilter !== 'all') {
      result = result.filter((incident) => incident.impact === impactFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter((incident) => incident.project_name === projectFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | null = null;
      let bValue: string | null = null;

      switch (sortField) {
        case 'incident_id':
          aValue = a.incident_id;
          bValue = b.incident_id;
          break;
        case 'project_name':
          aValue = a.project_name;
          bValue = b.project_name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'impact':
          aValue = a.impact;
          bValue = b.impact;
          break;
        case 'waktu_kejadian':
          aValue = a.waktu_kejadian;
          bValue = b.waktu_kejadian;
          break;
        case 'waktu_chat':
          aValue = a.waktu_chat;
          bValue = b.waktu_chat;
          break;
      }

      if (!aValue && !bValue) return 0;
      if (!aValue) return sortDirection === 'asc' ? 1 : -1;
      if (!bValue) return sortDirection === 'asc' ? -1 : 1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [incidents, search, statusFilter, impactFilter, projectFilter, sortField, sortDirection]);

  const uniqueImpacts = useMemo(() => {
    const impacts = new Set(incidents.map((i) => i.impact).filter(Boolean));
    return Array.from(impacts) as string[];
  }, [incidents]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set(incidents.map((i) => i.project_name).filter(Boolean));
    return Array.from(projects) as string[];
  }, [incidents]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const handleStatusUpdate = async (id: string, newStatus: IncidentStatus) => {
    try {
      await onStatusChange(id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-200">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, description, or PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Impact Filter */}
        <div className="relative">
          <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Impact</option>
            {uniqueImpacts.map((impact) => (
              <option key={impact} value={impact}>
                {impact}
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
        <div className="relative">
          <FolderKanban className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Projects</option>
            {uniqueProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredAndSortedIncidents.length} of {incidents.length} incidents
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('incident_id')}
                >
                  <div className="flex items-center gap-1">
                    Incident ID
                    <SortIcon field="incident_id" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('project_name')}
                >
                  <div className="flex items-center gap-1">
                    Project
                    <SortIcon field="project_name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('impact')}
                >
                  <div className="flex items-center gap-1">
                    Impact
                    <SortIcon field="impact" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PIC
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('waktu_chat')}
                >
                  <div className="flex items-center gap-1">
                    Reported
                    <SortIcon field="waktu_chat" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredAndSortedIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {incident.incident_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                        <FolderKanban className="w-3 h-3" />
                        {incident.project_name || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={incident.status}
                        onChange={(e) =>
                          handleStatusUpdate(incident.id, e.target.value as IncidentStatus)
                        }
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
                          incident.status === 'New' && 'bg-blue-100 text-blue-800',
                          incident.status === 'In Progress' && 'bg-yellow-100 text-yellow-800',
                          incident.status === 'Resolved' && 'bg-green-100 text-green-800',
                          incident.status === 'Closed' && 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {incident.incident_type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium border',
                          getImpactColor(incident.impact)
                        )}
                      >
                        {incident.impact || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {incident.pic || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {getRelativeTime(incident.waktu_chat)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <DetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}

// Detail Modal Component
function DetailModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-gray-500">Incident ID</span>
            <h2 className="text-xl font-bold text-gray-900">{incident.incident_id}</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                incident.status === 'New' && 'bg-blue-100 text-blue-800',
                incident.status === 'In Progress' && 'bg-yellow-100 text-yellow-800',
                incident.status === 'Resolved' && 'bg-green-100 text-green-800',
                incident.status === 'Closed' && 'bg-gray-100 text-gray-800'
              )}
            >
              {incident.status}
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                getImpactColor(incident.impact)
              )}
            >
              {incident.impact || 'Unknown'} Impact
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {incident.incident_type || 'Unknown'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <FolderKanban className="w-3 h-3" />
              {incident.project_name || 'General'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Description</span>
            <p className="text-gray-700 mt-1">
              {incident.description || 'No description provided'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">PIC</p>
                <p>{incident.pic || 'Unassigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p>{incident.phone_number || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Incident Time</p>
                <p>{formatDate(incident.waktu_kejadian)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Reported Time</p>
                <p>{formatDate(incident.waktu_chat)}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400 pt-4 border-t">
            Created: {formatDate(incident.created_at)} • Updated: {formatDate(incident.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
