import { updateWidget } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateWidget = (dashboardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWidget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['dashboards', dashboardId]
      });
    }
  });
};

export default useUpdateWidget;
