import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWidget } from '../services/api';

interface UseDeleteWidgetOptions {
  dashboardId: string;
}

export function useDeleteWidgetMutation({ dashboardId }: UseDeleteWidgetOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(dashboardId, widgetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] });
      await queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}
