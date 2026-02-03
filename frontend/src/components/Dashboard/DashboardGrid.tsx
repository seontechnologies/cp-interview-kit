import { useState, useCallback, ReactNode } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboardStore } from '../../store/dashboardSlice';
import { updateWidget } from '../../services/api';

interface DashboardGridProps {
  dashboardId: string;
  children: ReactNode;
}

export default function DashboardGrid({ dashboardId, children }: DashboardGridProps) {
  const { currentDashboard, updateWidget: updateWidgetInStore } = useDashboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const layout = currentDashboard?.widgets.map((widget) => ({
    i: widget.id,
    x: widget.position?.x ?? 0,
    y: widget.position?.y ?? 0,
    w: widget.position?.w ?? 4,
    h: widget.position?.h ?? 3,
    minW: 2,
    minH: 2,
  })) || [];
  const handleLayoutChange = useCallback(
    async (newLayout: any[]) => {
      if (!currentDashboard || isDragging) return;
      for (const item of newLayout) {
        const widget = currentDashboard.widgets.find((w) => w.id === item.i);
        if (widget) {
          const newPosition = { x: item.x, y: item.y, w: item.w, h: item.h };

          // Check if position actually changed
          if (
            widget.position?.x !== newPosition.x ||
            widget.position?.y !== newPosition.y ||
            widget.position?.w !== newPosition.w ||
            widget.position?.h !== newPosition.h
          ) {
            // Update store
            updateWidgetInStore(dashboardId, item.i, { position: newPosition });

            // Update API (fire and forget - no await)
            updateWidget(dashboardId, item.i, { position: newPosition });
          }
        }
      }
    },
    [currentDashboard, dashboardId, isDragging]
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  };

  if (!currentDashboard) {
    return null;
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
