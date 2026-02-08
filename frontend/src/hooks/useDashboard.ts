import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['dashboards'],
    queryFn: fetchDashboards,
  });
}

export function useDashboard(dashboardId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => fetchDashboard(dashboardId!),
    enabled: !!dashboardId,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDashboard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useCreateWidget(dashboardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createWidget(dashboardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
    },
  });
}

export function useUpdateWidget(dashboardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ widgetId, data }: { widgetId: string; data: any }) =>
      updateWidget(dashboardId, widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
    },
  });
}

export function useDeleteWidget(dashboardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(dashboardId, widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
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
  const fetchAll = useCallback(async () => {
    const results = await Promise.all(
      widgetIds.map((widgetId) => fetchWidgetData(dashboardId, widgetId))
    );
    return results;
  }, [dashboardId, widgetIds]);

  return useQuery({
    queryKey: ['batch-widget-data', dashboardId, widgetIds],
    queryFn: fetchAll,
    enabled: widgetIds.length > 0,
  });
}
