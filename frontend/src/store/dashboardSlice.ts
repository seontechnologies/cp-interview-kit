import { create } from 'zustand';

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
  _count?: { widgets: number };
}

interface DashboardState {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;

  setDashboards: (dashboards: Dashboard[]) => void;
  addDashboard: (dashboard: Dashboard) => void;
  removeDashboard: (id: string) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;

  addWidget: (dashboardId: string, widget: Widget) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  setWidgetData: (dashboardId: string, widgetId: string, data: any) => void;
  reorderWidgets: (dashboardId: string, widgets: Widget[]) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  currentDashboard: null,
  isLoading: false,
  error: null,

  setDashboards: (dashboards) => {
    set({ dashboards });
  },

  addDashboard: (dashboard) => {
    const dashboards = get().dashboards;
    dashboards.push(dashboard);
    set({ dashboards });
  },

  removeDashboard: (id) => {
    // This one is correct (creates new array)
    set({
      dashboards: get().dashboards.filter((d) => d.id !== id),
    });
  },

  setCurrentDashboard: (dashboard) => {
    set({ currentDashboard: dashboard });
  },

  updateDashboard: (id, updates) => {
    const dashboard = get().dashboards.find((d) => d.id === id);
    if (dashboard) {
      Object.assign(dashboard, updates);
      set({ dashboards: get().dashboards });
    }

    // Also update current if it matches
    const current = get().currentDashboard;
    if (current?.id === id) {
      Object.assign(current, updates);
      set({ currentDashboard: current });
    }
  },

  addWidget: (dashboardId, widget) => {
    const dashboards = get().dashboards;
    const dashboard = dashboards.find((d) => d.id === dashboardId);

    if (dashboard) {
      dashboard.widgets.push(widget);
      set({ dashboards });
    }

    // Update current dashboard too
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      current.widgets.push(widget);
      set({ currentDashboard: current });
    }
  },

  updateWidget: (dashboardId, widgetId, updates) => {
    const dashboards = get().dashboards;
    const dashboard = dashboards.find((d) => d.id === dashboardId);

    if (dashboard) {
      const widget = dashboard.widgets.find((w) => w.id === widgetId);
      if (widget) {
        Object.assign(widget, updates);
        set({ dashboards });
      }
    }

    // Update current dashboard
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      const widget = current.widgets.find((w) => w.id === widgetId);
      if (widget) {
        Object.assign(widget, updates);
        set({ currentDashboard: current });
      }
    }
  },

  removeWidget: (dashboardId, widgetId) => {
    const dashboards = get().dashboards;
    const dashboard = dashboards.find((d) => d.id === dashboardId);

    if (dashboard) {
      const index = dashboard.widgets.findIndex((w) => w.id === widgetId);
      if (index !== -1) {
        dashboard.widgets.splice(index, 1);
      }
      set({ dashboards });
    }

    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      const index = current.widgets.findIndex((w) => w.id === widgetId);
      if (index !== -1) {
        current.widgets.splice(index, 1);
      }
      set({ currentDashboard: current });
    }
  },

  setWidgetData: (dashboardId, widgetId, data) => {
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      const widget = current.widgets.find((w) => w.id === widgetId);
      if (widget) {
        widget.data = data;
        set({ currentDashboard: current });
      }
    }
  },

  reorderWidgets: (dashboardId, widgets) => {
    // This one is okay since we're replacing the array
    const dashboards = get().dashboards.map((d) =>
      d.id === dashboardId ? { ...d, widgets } : d
    );
    set({ dashboards });

    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      set({ currentDashboard: { ...current, widgets } });
    }
  },
}));
