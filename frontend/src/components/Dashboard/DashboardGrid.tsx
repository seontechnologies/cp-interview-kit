import { useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { updateWidget } from '../../services/api';

interface Widget {
  id: string;
  name: string;
  type: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  data?: any;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: string;
  widgets: Widget[];
}

interface DashboardGridProps {
  dashboard: Dashboard;
  children: ReactNode;
}

export default function DashboardGrid({ dashboard, children }: DashboardGridProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const layout = dashboard.widgets.map((widget) => ({
    i: widget.id,
    x: widget.position?.x ?? 0,
    y: widget.position?.y ?? 0,
    w: widget.position?.w ?? 4,
    h: widget.position?.h ?? 3,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange = useCallback(
    async (newLayout: any[]) => {
      if (isDragging) return;
      for (const item of newLayout) {
        const widget = dashboard.widgets.find((w) => w.id === item.i);
        if (widget) {
          const newPosition = { x: item.x, y: item.y, w: item.w, h: item.h };

          // Check if position actually changed
          if (
            widget.position?.x !== newPosition.x ||
            widget.position?.y !== newPosition.y ||
            widget.position?.w !== newPosition.w ||
            widget.position?.h !== newPosition.h
          ) {
            // Update API
            try {
              await updateWidget(dashboard.id, item.i, { position: newPosition });
              // Invalidate to refetch with new positions
              queryClient.invalidateQueries({ queryKey: ['dashboard', dashboard.id] });
            } catch (error) {
              console.error('Failed to update widget position:', error);
            }
          }
        }
      }
    },
    [dashboard, isDragging, queryClient]
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  }

  return (
    <div className="dashboard-grid">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={1200}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        draggableHandle=".widget-drag-handle"
        compactType={null}
        preventCollision={true}
      >
        {children}
      </GridLayout>
    </div>
  );
}
