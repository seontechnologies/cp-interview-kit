import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWebhooks,
  fetchWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
  testWebhook,
  fetchWebhookDeliveries
} from '../services/api';

const WEBHOOK_EVENTS = [
  'dashboard.created',
  'dashboard.updated',
  'dashboard.deleted',
  'widget.created',
  'widget.updated',
  'widget.deleted',
  'analytics.event',
  'user.invited',
  'user.joined',
  'user.removed',
  'billing.invoice',
  'billing.payment',
];

export default function Webhooks() {
  const { webhookId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [newWebhookDescription, setNewWebhookDescription] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchWebhooks,
    enabled: !webhookId,
  });

  const { data: webhook } = useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: () => fetchWebhook(webhookId!),
    enabled: !!webhookId,
  });

  // Intentional flaw: No pagination - loads all deliveries at once
  const { data: deliveries } = useQuery({
    queryKey: ['webhookDeliveries', webhookId],
    queryFn: () => fetchWebhookDeliveries(webhookId!),
    enabled: !!webhookId,
  });

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create webhook');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['webhook', webhookId] });
      setShowEditModal(false);
      setEditingWebhook(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update webhook');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      if (webhookId) {
        navigate('/webhooks');
      }
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateWebhookSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook', webhookId] });
    },
  });

  const testMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (err: any) => {
      setTestResult({ error: err.response?.data?.error || 'Test failed' });
    },
  });

  const resetForm = () => {
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
    setNewWebhookDescription('');
    setError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWebhookEvents.length === 0) {
      setError('Please select at least one event');
      return;
    }
    createMutation.mutate({
      url: newWebhookUrl,
      events: newWebhookEvents,
      description: newWebhookDescription,
    });
  };

  const handleEdit = (webhook: any) => {
    setEditingWebhook(webhook);
    setNewWebhookUrl(webhook.url);
    setNewWebhookEvents(webhook.events || []);
    setNewWebhookDescription(webhook.description || '');
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebhook) return;
    updateMutation.mutate({
      id: editingWebhook.id,
      data: {
        url: newWebhookUrl,
        events: newWebhookEvents,
      },
    });
  };

  const toggleEvent = (event: string) => {
    setNewWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading webhooks...</div>
      </div>
    );
  }

  // Webhook detail view
  if (webhookId && webhook) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/webhooks')}
            className="text-gray-600 hover:text-gray-800"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">Webhook Details</h1>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(webhook)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => deleteMutation.mutate(webhook.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="p-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">URL</dt>
                <dd className="font-mono text-sm">{webhook.url}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      webhook.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Events</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {webhook.events?.map((event: string) => (
                    <span
                      key={event}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {event}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Secret</dt>
                {/* Intentional flaw: Webhook secret displayed in plain text */}
                <dd className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                  {webhook.secret}
                </dd>
                <button
                  onClick={() => regenerateMutation.mutate(webhook.id)}
                  disabled={regenerateMutation.isPending}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate Secret'}
                </button>
              </div>
            </dl>
          </div>
        </div>

        {/* Test Webhook */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Test Webhook</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => testMutation.mutate(webhook.id)}
              disabled={testMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {testMutation.isPending ? 'Testing...' : 'Send Test Event'}
            </button>
            {testResult && (
              <div
                className={`mt-4 p-3 rounded ${
                  testResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {testResult.error ? testResult.error : `Success! Response: ${testResult.statusCode}`}
              </div>
            )}
          </div>
        </div>

        {/* Delivery History - Intentional flaw: No pagination */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Delivery History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Event</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Response</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {deliveries?.map((delivery: any) => (
                  <tr key={delivery.id} className="border-b">
                    <td className="py-3 px-4 font-mono text-sm">{delivery.event}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          delivery.statusCode >= 200 && delivery.statusCode < 300
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {delivery.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-xs">
                      {delivery.responseBody}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!deliveries || deliveries.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No deliveries yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Edit Webhook</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/webhook"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Events
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label key={event} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="mr-2"
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Webhooks list view
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Webhook
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {webhooks?.length > 0 ? (
          <div className="divide-y">
            {webhooks.map((webhook: any) => (
              <div
                key={webhook.id}
                className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => navigate(`/webhooks/${webhook.id}`)}
              >
                <div>
                  <div className="font-mono text-sm">{webhook.url}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {webhook.events?.length || 0} events
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      webhook.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No webhooks configured. Create one to get started.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create Webhook</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newWebhookDescription}
                  onChange={(e) => setNewWebhookDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Production Slack notifications"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="mr-2"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
