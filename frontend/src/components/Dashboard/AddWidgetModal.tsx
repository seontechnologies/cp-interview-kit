import { useState } from 'react';

interface AddWidgetModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; type: string; config: any }) => void;
  isLoading?: boolean;
}

export default function AddWidgetModal({ onClose, onSubmit, isLoading }: AddWidgetModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('metric');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config = type === 'metric'
      ? { title: name, format: 'number' }
      : type === 'chart'
      ? { chartType: 'bar', title: name }
      : type === 'table'
      ? { sortable: true, pageSize: 10 }
      : { content: '' };

    onSubmit({ name, type, config });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Widget</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widget Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Widget"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widget Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="metric">Metric</option>
              <option value="chart">Chart</option>
              <option value="table">Table</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
