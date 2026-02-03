import { useState, useMemo } from 'react';

interface TableWidgetProps {
  config: {
    columns?: Array<{
      key: string;
      label: string;
      format?: 'string' | 'number' | 'date' | 'json';
    }>;
    sortable?: boolean;
    pageSize?: number;
  };
  data: any[];
}

export default function TableWidget({ config, data }: TableWidgetProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize = config?.pageSize || 10;

  // Derive columns from data if not configured
  const columns = useMemo(() => {
    if (config?.columns && config.columns.length > 0) {
      return config.columns;
    }

    if (!data || data.length === 0) return [];

    // Auto-generate columns from first row
    return Object.keys(data[0]).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      format: 'string' as const,
    }));
  }, [config?.columns, data]);

  // Sort and paginate data
  const processedData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Paginate
    const start = currentPage * pageSize;
    return result.slice(start, start + pageSize);
  }, [data, sortColumn, sortDirection, currentPage, pageSize]);

  const totalPages = data ? Math.ceil(data.length / pageSize) : 0;

  const handleSort = (columnKey: string) => {
    if (!config?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'date':
        return new Date(value).toLocaleString();
      case 'json':
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      default:
        return String(value);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2 text-left font-medium text-gray-600 ${
                    config?.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  {col.label}
                  {sortColumn === col.key && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 truncate max-w-xs">
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
