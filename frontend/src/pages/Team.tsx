import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamMembers, inviteMember, searchUsers } from '../services/api';
import { api } from '../services/api';
import { useHasRole } from '../hooks/useAuth';

export default function Team() {
  const queryClient = useQueryClient();
  const canManageUsers = useHasRole(['owner', 'admin']);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: members, isLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: fetchTeamMembers,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('member');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to invite member');
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: any }) =>
      api.put(`/organizations/members/${memberId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/organizations/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inviteEmail || !inviteName) {
      setError('Email and name are required');
      return;
    }

    inviteMutation.mutate({ email: inviteEmail, name: inviteName, role: inviteRole });
  };
  // Intentional flaw: No confirmation dialog before removing members
  const handleRemove = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  // Intentional flaw: Role change is immediate without undo option
  const handleRoleChange = (memberId: string, newRole: string) => {
    updateMemberMutation.mutate({ memberId, data: { role: newRole } });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchUsers(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <div className="flex gap-4">
          {/* Search Users */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="px-3 py-2 border border-gray-300 rounded-md w-64"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((user: any) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer flex items-center"
                    onClick={() => {
                      setInviteEmail(user.email);
                      setInviteName(user.name);
                      setShowInviteModal(true);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                  >
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {canManageUsers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Member</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Last Active</th>
                {canManageUsers && <th className="text-left py-3 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any) => (
                <tr key={member.id} className="border-b">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {canManageUsers && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                        disabled={updateMemberMutation.isPending}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="capitalize">{member.role}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        member.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  {canManageUsers && (
                    <td className="py-3 px-4">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={removeMemberMutation.isPending}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="colleague@company.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="John Doe"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
