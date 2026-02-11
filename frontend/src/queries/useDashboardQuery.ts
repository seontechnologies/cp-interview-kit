import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../services/api';

export function useDashboardQuery(dashboardId?: string) {
  return useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => fetchDashboard(dashboardId!),
    enabled: !!dashboardId,
    refetchOnWindowFocus: false
  });
}
