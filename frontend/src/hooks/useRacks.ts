import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchRacks, type RackSummary } from "../lib/api";

/**
 * Hook for fetching all available racks
 * Caches data with a longer stale time since racks don't change frequently
 */
export function useRacks(): UseQueryResult<RackSummary[]> {
  return useQuery({
    queryKey: ["racks"],
    queryFn: fetchRacks,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    placeholderData: (previousData) => previousData
  });
}

/**
 * Hook to get a specific rack by ID
 */
export function useRack(rackId: string | null): UseQueryResult<RackSummary | undefined> {
  const racksQuery = useRacks();

  return useQuery({
    queryKey: ["rack", rackId],
    queryFn: () => {
      if (!rackId) {
        return undefined;
      }
      return racksQuery.data?.find((rack) => rack.id === rackId);
    },
    enabled: Boolean(rackId && racksQuery.data),
    staleTime: Number.POSITIVE_INFINITY, // Derived data, never stale
    placeholderData: (previousData) => previousData
  });
}
