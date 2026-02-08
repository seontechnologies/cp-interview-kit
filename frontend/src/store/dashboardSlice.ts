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
    set({ dashboards: [...get().dashboards, dashboard] });
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
    set({
      dashboards: get().dashboards.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    });

    // Also update current if it matches
    const current = get().currentDashboard;
    if (current?.id === id) {
      set({ currentDashboard: { ...current, ...updates } });
    }
  },

  addWidget: (dashboardId, widget) => {
    set({
      dashboards: get().dashboards.map((d) =>
        // TODO: Analyze if we should use a library like immer to
        // reduce the amount of boilerplate when updating nested state
        d.id === dashboardId ? { ...d, widgets: [...d.widgets, widget] } : d
      ),
    });

    // Update current dashboard too
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      set({
        currentDashboard: {
          ...current,
          widgets: [...current.widgets, widget],
        },
      });
    }
  },

  updateWidget: (dashboardId, widgetId, updates) => {
    set({
      dashboards: get().dashboards.map((d) =>
        d.id === dashboardId
          ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, ...updates } : w
              ),
            }
          : d
      ),
    });

    // Update current dashboard
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      set({
        currentDashboard: {
          ...current,
          widgets: current.widgets.map((w) =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        },
      });
    }
  },

  removeWidget: (dashboardId, widgetId) => {
    set({
      dashboards: get().dashboards.map((d) =>
        d.id === dashboardId
          ? {
              ...d,
              widgets: d.widgets.filter((w) => w.id !== widgetId),
            }
          : d
      ),
    });

    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      set({
        currentDashboard: {
          ...current,
          widgets: current.widgets.filter((w) => w.id !== widgetId),
        },
      });
    }
  },

  setWidgetData: (dashboardId, widgetId, data) => {
    const current = get().currentDashboard;
    if (current?.id === dashboardId) {
      set({
        currentDashboard: {
          ...current,
          widgets: current.widgets.map((w) =>
            w.id === widgetId ? { ...w, data } : w
          ),
        },
      });
    }

    // Also update in dashboards array
    set({
      dashboards: get().dashboards.map((d) =>
        d.id === dashboardId
          ? {
              ...d,
              widgets: d.widgets
                ? d.widgets.map((w) => (w.id === widgetId ? { ...w, data } : w))
                : [],
            }
          : d
      ),
    });
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
