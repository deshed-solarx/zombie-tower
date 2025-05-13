import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, isStaticMode } from "./apiConfig";

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
  // If this is a relative URL and not starting with /api, prepend the API base URL
  const fullUrl = url.startsWith('/api') || url.startsWith('http') 
    ? url 
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  
  // For static deployments without a backend, we can skip actual API calls
  if (isStaticMode && import.meta.env.PROD) {
    console.log(`Static deployment - skipping API call to: ${fullUrl}`);
    // Return a mock response
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const res = await fetch(fullUrl, {
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
    // Handle static deployments without a backend
    if (isStaticMode && import.meta.env.PROD) {
      console.log(`Static deployment - skipping query for: ${queryKey[0]}`);
      return null; // Return null for static deployments
    }
    
    const url = queryKey[0] as string;
    // If this is a relative URL and not starting with /api, prepend the API base URL
    const fullUrl = url.startsWith('/api') || url.startsWith('http') 
      ? url 
      : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});