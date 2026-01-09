import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Cache times for different data types - use selectively where mutations guarantee invalidation
export const CACHE_TIMES = {
  // Reference data that rarely changes (leagues, competitions structure)
  STABLE: 5 * 60 * 1000, // 5 minutes
  // User-specific data that may update (profile, tier assignments)
  USER_DATA: 2 * 60 * 1000, // 2 minutes
  // Frequently updating data (standings, results, check-ins)
  DYNAMIC: 30 * 1000, // 30 seconds
  // Notifications that should be fresh
  NOTIFICATIONS: 15 * 1000, // 15 seconds
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Keep default as Infinity, apply caching selectively
      gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
