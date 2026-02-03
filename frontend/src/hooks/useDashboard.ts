import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '../store/dashboardSlice';
import {
  fetchDashboards,
  fetchDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  createWidget,
  updateWidget,
  deleteWidget,
  fetchWidgetData,
} from '../services/api';

export function useDashboards() {
  const { setDashboards } = useDashboardStore();

  const query = useQuery({
    queryKey: ['dashboards'],
    queryFn: fetchDashboards,
  });
  useEffect(() => {
    if (query.data) {
      setDashboards(query.data);
    }
  }, [query.data]);

  return query;
}

export function useDashboard(dashboardId: string | undefined) {
  const { setCurrentDashboard } = useDashboardStore();

  const query = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => fetchDashboard(dashboardId!),
    enabled: !!dashboardId,
  });
  useEffect(() => {
    if (query.data) {
      setCurrentDashboard(query.data);
    }
  }, [query.data]);

  return query;
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  const { addDashboard } = useDashboardStore();

  return useMutation({
    mutationFn: createDashboard,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      addDashboard(data);
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  const { updateDashboard: updateInStore } = useDashboardStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDashboard(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.id] });
      updateInStore(variables.id, data);
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  const { removeDashboard } = useDashboardStore();

  return useMutation({
    mutationFn: deleteDashboard,
    onSuccess: (_, dashboardId) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      removeDashboard(dashboardId);
    },
  });
}

export function useCreateWidget(dashboardId: string) {
  const queryClient = useQueryClient();
  const { addWidget } = useDashboardStore();

  return useMutation({
    mutationFn: (data: any) => createWidget(dashboardId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
      addWidget(dashboardId, data);
    },
  });
}

export function useUpdateWidget(dashboardId: string) {
  const queryClient = useQueryClient();
  const { updateWidget: updateInStore } = useDashboardStore();

  return useMutation({
    mutationFn: ({ widgetId, data }: { widgetId: string; data: any }) =>
      updateWidget(dashboardId, widgetId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
      updateInStore(dashboardId, variables.widgetId, data);
    },
  });
}

export function useDeleteWidget(dashboardId: string) {
  const queryClient = useQueryClient();
  const { removeWidget } = useDashboardStore();

  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(dashboardId, widgetId),
    onSuccess: (_, widgetId) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
      removeWidget(dashboardId, widgetId);
    },
  });
}
export function useWidgetData(dashboardId: string, widgetId: string) {
  return useQuery({
    queryKey: ['widget-data', dashboardId, widgetId],
    queryFn: () => fetchWidgetData(dashboardId, widgetId),
    staleTime: 10000, // 10 seconds
  });
}

// Batch fetch all widget data for a dashboard
export function useBatchWidgetData(dashboardId: string, widgetIds: string[]) {
  const queryClient = useQueryClient();
  const { setWidgetData } = useDashboardStore();

  const fetchAll = useCallback(async () => {
    const results = await Promise.all(
      widgetIds.map((widgetId) => fetchWidgetData(dashboardId, widgetId))
    );

    // Update store
    results.forEach((result, index) => {
      setWidgetData(dashboardId, widgetIds[index], result.data);
    });

    return results;
  }, [dashboardId, widgetIds]);

  return useQuery({
    queryKey: ['batch-widget-data', dashboardId, widgetIds],
    queryFn: fetchAll,
    enabled: widgetIds.length > 0,
  });
}
