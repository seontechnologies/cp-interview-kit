import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDashboard } from '../services/api';

interface UseCreateDashboardOptions {
  onSuccess?: () => void;
}

export function useCreateDashboardMutation({
  onSuccess
}: UseCreateDashboardOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      onSuccess?.();
    }
  });
}
