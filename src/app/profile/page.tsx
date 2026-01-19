'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Mail,
  Shield,
  Camera,
  Loader2,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  // Use untyped client to avoid strict type issues with profiles table
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const userInitials = (fullName || user?.email?.split('@')[0] || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-xs text-gray-500">Manage your account information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                      {userInitials}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg text-gray-600 hover:text-blue-600 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">{fullName || 'Your Name'}</h2>
                  <p className="text-blue-100">{user?.email}</p>
                  {profile?.role && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full capitalize">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700">Profile updated successfully!</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact admin if you need to update it.
                </p>
              </div>

              {/* Role (Read-only) */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="role"
                    type="text"
                    value={profile?.role || 'user'}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your role determines your access level. Contact admin to change.
                </p>
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL for your profile picture
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Link
                  href="/"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">User ID</p>
                <p className="font-mono text-gray-700 truncate">{user?.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="text-gray-700">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-700">
                  {profile?.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email Verified</p>
                <p className="text-gray-700">
                  {user?.email_confirmed_at ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600">Pending verification</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => alert('Contact admin to delete your account')}
              className="px-4 py-2 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
