import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authSlice';
import {
  fetchCurrentUser,
  updateUser,
  fetchOrganization,
  fetchUserPreferences,
  updateUserPreferences,
  fetchUserSessions,
  revokeSession,
  revokeAllSessions,
  deleteAccount
} from '../services/api';
import { api } from '../services/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'sessions' | 'danger'>('profile');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  });

  const { data: orgData } = useQuery({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchUserPreferences,
  });

  // Intentional flaw: Session list doesn't auto-refresh after revocation
  const { data: sessions } = useQuery({
    queryKey: ['userSessions'],
    queryFn: fetchUserSessions,
  });
  useEffect(() => {
    if (userData) {
      setName(userData.name);
    }
  }, [userData]); // Correct

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUser(data),
    onSuccess: (data) => {
      setUser(data);
      setMessage('Profile updated successfully');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Update failed');
      setMessage('');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/users/me/password', data),
    onSuccess: () => {
      setMessage('Password changed successfully');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Password change failed');
      setMessage('');
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      setMessage('Preferences updated successfully');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update preferences');
      setMessage('');
    },
  });

  // Intentional flaw: doesn't invalidate sessions query after revocation
  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      setMessage('Session revoked');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to revoke session');
      setMessage('');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      logout();
      navigate('/login');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete account');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    updateMutation.mutate({ name });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Intentional flaw: Password change doesn't require current password confirmation in some flows
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handlePreferencesSubmit = (prefs: any) => {
    preferencesMutation.mutate(prefs);
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Organization Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Organization</h2>
            </div>
            <div className="p-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Name</dt>
                  <dd className="font-medium">{orgData?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Slug</dt>
                  <dd className="font-medium">{orgData?.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Tier</dt>
                  <dd className="font-medium capitalize">{orgData?.tier}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Your Role</dt>
                  <dd className="font-medium capitalize">{userData?.role}</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">User Preferences</h2>
          </div>
          <div className="p-4 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences?.darkMode ?? false}
                onChange={(e) =>
                  handlePreferencesSubmit({ ...preferences, darkMode: e.target.checked })
                }
                className="mr-2"
              />
              Dark Mode
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences?.emailDigest ?? true}
                onChange={(e) =>
                  handlePreferencesSubmit({ ...preferences, emailDigest: e.target.checked })
                }
                className="mr-2"
              />
              Weekly Email Digest
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences?.compactView ?? false}
                onChange={(e) =>
                  handlePreferencesSubmit({ ...preferences, compactView: e.target.checked })
                }
                className="mr-2"
              />
              Compact View
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={preferences?.timezone || 'UTC'}
                onChange={(e) =>
                  handlePreferencesSubmit({ ...preferences, timezone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                value={preferences?.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) =>
                  handlePreferencesSubmit({ ...preferences, dateFormat: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <button
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Revoke All Sessions
            </button>
          </div>
          <div className="divide-y">
            {sessions?.map((session: any) => (
              <div key={session.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {session.userAgent || 'Unknown Device'}
                    {session.current && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.ipAddress} - Last active:{' '}
                    {new Date(session.lastActiveAt).toLocaleString()}
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                    disabled={revokeSessionMutation.isPending}
                    className="text-red-600 hover:text-red-800"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <div className="p-4 text-center text-gray-500">No active sessions</div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="bg-white rounded-lg shadow border-2 border-red-200">
          <div className="p-4 border-b bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-gray-500">
                  Permanently delete your account and all associated data
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal('confirm')}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This action cannot be undone.
                All your data will be permanently deleted.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal('')}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
