'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, 
  Table, 
  RefreshCw, 
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock,
  CheckCircle2,
  Archive,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DataTable } from '@/components/DataTable';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'table';

export default function Dashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { incidents, loading, error, updateStatus, refetch } = useIncidents();
  const { user, profile, signOut } = useAuth();

  // Calculate stats
  const stats = {
    total: incidents.length,
    new: incidents.filter((i) => i.status === 'New').length,
    inProgress: incidents.filter((i) => i.status === 'In Progress').length,
    resolved: incidents.filter((i) => i.status === 'Resolved').length,
    closed: incidents.filter((i) => i.status === 'Closed').length,
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Incident Tracker</h1>
                <p className="text-xs text-gray-500">Management Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-gray-500 hidden sm:inline">Syncing...</span>
                  </>
                ) : error ? (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 hidden sm:inline">Disconnected</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 hidden sm:inline">Live</span>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={refetch}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
              </button>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    viewMode === 'kanban'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {userInitials}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        {profile?.role && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
                            {profile.role}
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/profile');
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            signOut();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total"
              value={stats.total}
              color="text-gray-700"
              bgColor="bg-gray-100"
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="New"
              value={stats.new}
              color="text-blue-700"
              bgColor="bg-blue-100"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="In Progress"
              value={stats.inProgress}
              color="text-yellow-700"
              bgColor="bg-yellow-100"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Resolved"
              value={stats.resolved}
              color="text-green-700"
              bgColor="bg-green-100"
            />
            <StatCard
              icon={<Archive className="w-5 h-5" />}
              label="Closed"
              value={stats.closed}
              color="text-gray-600"
              bgColor="bg-gray-100"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load incidents</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={refetch}
              className="ml-auto px-3 py-1 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading && incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading incidents...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard incidents={incidents} onStatusChange={updateStatus} />
        ) : (
          <DataTable incidents={incidents} onStatusChange={updateStatus} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Incident Management Dashboard</p>
            <p>Realtime updates powered by Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stats Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-gray-200',
        className
      )}
    >
      <div className={cn('p-2 rounded-lg', bgColor, color)}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
