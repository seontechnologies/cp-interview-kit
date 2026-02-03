import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSharedDashboard } from '../services/api';

export default function SharedDashboard() {
  const { shareId } = useParams();

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['sharedDashboard', shareId],
    queryFn: () => fetchSharedDashboard(shareId!),
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Not Found</h1>
          <p className="text-gray-500">
            This shared dashboard may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-gray-500 text-sm">{dashboard.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-400">
              Shared by {dashboard.organization?.name || 'InsightHub'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {dashboard.widgets?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.widgets.map((widget: any) => (
              <div key={widget.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">{widget.name}</h3>
                <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-400">Widget: {widget.type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            This dashboard has no widgets yet.
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-sm text-gray-400">
        Powered by InsightHub
      </footer>
    </div>
  );
}
