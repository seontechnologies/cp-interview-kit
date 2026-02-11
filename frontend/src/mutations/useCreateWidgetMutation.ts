import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWidget } from '../services/api';

interface UseCreateWidgetOptions {
  dashboardId: string;
  onSuccess?: () => void;
}

export function useCreateWidgetMutation({
  dashboardId,
  onSuccess
}: UseCreateWidgetOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; type: string; config: any }) =>
      createWidget(dashboardId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', dashboardId]
      });
      await queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      onSuccess?.();
    }
  });
}
