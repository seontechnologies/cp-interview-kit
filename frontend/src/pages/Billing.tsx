import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBillingOverview,
  fetchInvoices,
  fetchBillingUsage,
  fetchInvoice,
  setBudgetAlert,
  updatePaymentMethod
} from '../services/api';
import { api } from '../services/api';

export default function Billing() {
  const queryClient = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetThreshold, setBudgetThreshold] = useState(100);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: fetchBillingOverview,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });

  const { data: pricing } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.get('/billing/pricing').then((r) => r.data),
  });

  const { data: usage } = useQuery({
    queryKey: ['billingUsage'],
    queryFn: fetchBillingUsage,
  });

  const { data: invoiceDetail } = useQuery({
    queryKey: ['invoice', selectedInvoice?.id],
    queryFn: () => fetchInvoice(selectedInvoice!.id),
    enabled: !!selectedInvoice?.id,
  });

  const upgradeMutation = useMutation({
    mutationFn: (tier: string) => api.post('/billing/upgrade', { tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      setShowUpgradeModal(false);
    },
  });

  // Intentional flaw: Budget alert threshold not validated (can set negative)
  const budgetAlertMutation = useMutation({
    mutationFn: setBudgetAlert,
    onSuccess: () => {
      setShowBudgetModal(false);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });

  const paymentMethodMutation = useMutation({
    mutationFn: updatePaymentMethod,
    onSuccess: () => {
      setShowPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
  const usagePercentage = billing
    ? Math.min((billing.currentSpend / billing.monthlyBudget) * 100, 100)
    : 0;

  // Intentional flaw: Usage chart data rebuilds on every render
  const usageChartData = usage?.daily?.map((d: any) => ({
    date: d.date,
    events: d.events,
    cost: d.cost,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading billing info...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Current Plan</h2>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold capitalize">{billing?.tier}</div>
              <div className="text-gray-500">
                {billing?.hasPaymentMethod
                  ? 'Payment method on file'
                  : 'No payment method'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Payment Method
              </button>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Budget Alert
              </button>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Change Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Usage This Month</h2>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Spend</span>
              <span>
                ${billing?.currentSpend?.toFixed(2)} / ${billing?.monthlyBudget?.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(billing?.usage || {}).map(([metric, value]) => (
              <div key={metric} className="text-center">
                <div className="text-2xl font-bold">
                  {}
                  {(value as number).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {metric.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Period</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((invoice: any) => (
                <tr
                  key={invoice.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td className="py-3 px-4">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                    {new Date(invoice.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    ${invoice.amount?.toFixed(2)} {invoice.currency?.toUpperCase()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Choose a Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {pricing &&
                  Object.entries(pricing).map(([tier, details]: [string, any]) => (
                    <div
                      key={tier}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        selectedTier === tier
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-200'
                      } ${billing?.tier === tier ? 'bg-gray-50' : ''}`}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <h3 className="font-semibold text-lg">{details.name}</h3>
                      <div className="text-2xl font-bold mt-2">
                        {details.price === -1 ? 'Custom' : `$${details.price}`}
                        {details.price !== -1 && (
                          <span className="text-sm text-gray-500">/mo</span>
                        )}
                      </div>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li>
                          {details.features.events === -1
                            ? 'Unlimited'
                            : details.features.events.toLocaleString()}{' '}
                          events
                        </li>
                        <li>
                          {details.features.dashboards === -1
                            ? 'Unlimited'
                            : details.features.dashboards}{' '}
                          dashboards
                        </li>
                        <li>
                          {details.features.users === -1
                            ? 'Unlimited'
                            : details.features.users}{' '}
                          users
                        </li>
                        <li>{details.features.retention} day retention</li>
                      </ul>
                      {billing?.tier === tier && (
                        <div className="mt-4 text-sm text-blue-600">Current plan</div>
                      )}
                    </div>
                  ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => upgradeMutation.mutate(selectedTier)}
                  disabled={!selectedTier || selectedTier === billing?.tier || upgradeMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Alert Modal - Intentional flaw: allows negative values */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Set Budget Alert</h2>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold ($)
                </label>
                <input
                  type="number"
                  value={budgetThreshold}
                  onChange={(e) => setBudgetThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  You'll receive an alert when your spending reaches this amount.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => budgetAlertMutation.mutate(budgetThreshold)}
                  disabled={budgetAlertMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {budgetAlertMutation.isPending ? 'Saving...' : 'Set Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Update Payment Method</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 p-4 bg-gray-100 rounded text-center text-gray-500">
                Payment form would be integrated here (Stripe Elements, etc.)
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => paymentMethodMutation.mutate('pm_test_placeholder')}
                  disabled={paymentMethodMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {paymentMethodMutation.isPending ? 'Saving...' : 'Save Payment Method'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Invoice Details</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Invoice ID</dt>
                  <dd className="font-mono text-sm">{invoiceDetail?.id || selectedInvoice.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Period</dt>
                  <dd>
                    {new Date(selectedInvoice.periodStart).toLocaleDateString()} -{' '}
                    {new Date(selectedInvoice.periodEnd).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="font-semibold">
                    ${selectedInvoice.amount?.toFixed(2)} {selectedInvoice.currency?.toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        selectedInvoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedInvoice.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </dd>
                </div>
                {invoiceDetail?.lineItems && (
                  <div className="pt-3 border-t">
                    <dt className="text-gray-500 mb-2">Line Items</dt>
                    <dd>
                      {invoiceDetail.lineItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span>{item.description}</span>
                          <span>${item.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
