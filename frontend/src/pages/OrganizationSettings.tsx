import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  fetchOrganization,
  updateOrganization,
  deleteOrganization,
  fetchOrganizationSettings,
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  transferOwnership,
  fetchTeamMembers
} from '../services/api';
import { useAuthStore } from '../store/authSlice';

export default function OrganizationSettings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState(90);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [transferUserId, setTransferUserId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: org, isLoading: loadingOrg } = useQuery<any>({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
  });

  // Set form values when org data loads
  useEffect(() => {
    if (org) {
      setOrgName(org.name || '');
      setOrgSlug(org.slug || '');
    }
  }, [org]);

  const { data: settings } = useQuery<any>({
    queryKey: ['organizationSettings'],
    queryFn: fetchOrganizationSettings,
  });

  const { data: apiKeys, isLoading: loadingKeys } = useQuery<any[]>({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
  });

  const { data: members } = useQuery<any[]>({
    queryKey: ['teamMembers'],
    queryFn: fetchTeamMembers,
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: { name?: string; slug?: string }) => updateOrganization(data),
    onSuccess: () => {
      setMessage('Organization updated successfully');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update organization');
      setMessage('');
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete organization');
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; expiresIn?: number }) => createApiKey(data),
    onSuccess: (data) => {
      // Intentional flaw: API key shown but no copy button
      setCreatedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create API key');
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: transferOwnership,
    onSuccess: () => {
      setMessage('Ownership transferred successfully');
      setShowTransferModal(false);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to transfer ownership');
    },
  });

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate({ name: orgName, slug: orgSlug });
  };

  const handleDeleteOrg = () => {
    // Intentional flaw: doesn't require typing org name to confirm
    deleteOrgMutation.mutate();
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    createKeyMutation.mutate({ name: newKeyName, expiresIn: newKeyExpiry });
  };

  const handleTransfer = () => {
    if (transferUserId) {
      transferMutation.mutate(transferUserId);
    }
  };

  if (loadingOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading organization settings...</div>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>

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

      {/* Organization Details */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Organization Details</h2>
        </div>
        <form onSubmit={handleUpdateOrg} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!isOwner}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!isOwner}
            />
            <p className="text-sm text-gray-500 mt-1">
              Used in URLs and API calls
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <input
              type="text"
              value={org?.tier || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          {isOwner && (
            <button
              type="submit"
              disabled={updateOrgMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">API Keys</h2>
          {isOwner && (
            <button
              onClick={() => setShowCreateKeyModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              Create Key
            </button>
          )}
        </div>
        <div className="p-4">
          {loadingKeys ? (
            <div className="text-gray-500">Loading API keys...</div>
          ) : apiKeys?.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.expiresAt && ` | Expires: ${new Date(key.expiresAt).toLocaleDateString()}`}
                    </div>
                    <div className="text-sm font-mono text-gray-400">
                      {key.prefix}...
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={deleteKeyMutation.isPending}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No API keys created yet</div>
          )}
        </div>
      </div>

      {/* Settings */}
      {settings && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Organization Settings</h2>
          </div>
          <div className="p-4">
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-white rounded-lg shadow border-2 border-red-200">
          <div className="p-4 border-b bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Transfer Ownership</div>
                <div className="text-sm text-gray-500">
                  Transfer this organization to another member
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50"
              >
                Transfer
              </button>
            </div>

            <hr />

            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Delete Organization</div>
                <div className="text-sm text-gray-500">
                  Permanently delete this organization and all its data
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create API Key</h2>
              <button
                onClick={() => {
                  setShowCreateKeyModal(false);
                  setCreatedKey(null);
                  setNewKeyName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            {createdKey ? (
              <div className="p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <div className="text-sm text-yellow-800 mb-2">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </div>
                  {/* Intentional flaw: API key shown in full but no copy button */}
                  <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                    {createdKey}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateKeyModal(false);
                    setCreatedKey(null);
                    setNewKeyName('');
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Production API Key"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (days)
                  </label>
                  <select
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateKeyModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createKeyMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Intentional flaw: doesn't require typing org name */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">Delete Organization</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this organization? This action cannot be undone.
                All data, including dashboards, analytics, and team members will be permanently deleted.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrg}
                  disabled={deleteOrgMutation.isPending}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteOrgMutation.isPending ? 'Deleting...' : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Transfer Ownership</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Select a member to transfer ownership to. You will become an admin after transfer.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Owner
                </label>
                <select
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a member</option>
                  {members?.filter((m: any) => m.id !== user?.id).map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferUserId || transferMutation.isPending}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {transferMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
