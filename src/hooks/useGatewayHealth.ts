import { useQuery } from "@tanstack/react-query";
import { gatewayHealthApi } from "@/lib/api";

export const GATEWAY_HEALTH_QUERY_KEY = "gateway-health-probe" as const;

/**
 * Circuit Breaker / Health Probe Hook for Fastify API Gateway
 *
 * Monitors /api/v1/health with lightweight polling and exponential backoff
 * to detect Render cold starts (502 / timeout) and notify UI components.
 */
export function useGatewayHealth() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [GATEWAY_HEALTH_QUERY_KEY],
    queryFn: () => gatewayHealthApi.checkHealth(4000),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every 60 seconds
    retry: false,
  });

  const isHealthy = data?.isHealthy ?? true; // Default optimistic true while probe is initializing
  const isWarmingUp = data ? !data.isHealthy : false;
  const statusText = data?.statusText;

  return {
    isHealthy,
    isWarmingUp,
    isLoading: isLoading || isFetching,
    statusText,
    checkHealthNow: refetch,
  };
}
