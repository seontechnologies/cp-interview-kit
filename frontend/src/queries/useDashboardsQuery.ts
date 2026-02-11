import { useQuery } from '@tanstack/react-query';
import { fetchDashboards } from '../services/api';

export function useDashboardsQuery() {
  return useQuery({
    queryKey: ['dashboards'],
    queryFn: fetchDashboards,
    refetchOnWindowFocus: false
  });
}
