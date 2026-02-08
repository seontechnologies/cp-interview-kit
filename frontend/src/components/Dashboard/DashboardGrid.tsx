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

      // Batch all position updates
      const updates = newLayout
        .map((item) => {
          const widget = dashboard.widgets.find((w) => w.id === item.i);
          if (!widget) return null;

          const newPosition = { x: item.x, y: item.y, w: item.w, h: item.h };

          // Check if position actually changed
          if (
            widget.position?.x !== newPosition.x ||
            widget.position?.y !== newPosition.y ||
            widget.position?.w !== newPosition.w ||
            widget.position?.h !== newPosition.h
          ) {
            return { widgetId: item.i, position: newPosition };
          }
          return null;
        })
        .filter((update): update is { widgetId: string; position: any } => update !== null);

      if (updates.length === 0) return;

      // Optimistically update the cache
      const previousData = queryClient.getQueryData(['dashboard', dashboard.id]);

      queryClient.setQueryData(['dashboard', dashboard.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          widgets: old.widgets.map((w: Widget) => {
            const update = updates.find((u) => u.widgetId === w.id);
            return update ? { ...w, position: update.position } : w;
          }),
        };
      });

      // Send all updates in parallel
      try {
        await Promise.all(
          updates.map(({ widgetId, position }) =>
            updateWidget(dashboard.id, widgetId, { position })
          )
        );
      } catch (error) {
        console.error('Failed to update widget positions:', error);
        // Rollback to previous state on error
        queryClient.setQueryData(['dashboard', dashboard.id], previousData);
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
