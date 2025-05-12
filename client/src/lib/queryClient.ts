import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, isStaticMode, gameStorage } from "./apiConfig";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to handle common API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If this is a relative URL and not starting with /api, prepend the API base URL
  const fullUrl = url.startsWith('/api') || url.startsWith('http') 
    ? url 
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  
  // Special handling for high scores in static mode
  if (isStaticMode && url.includes('high-scores')) {
    let responseData = {};
    
    if (method === 'GET') {
      responseData = { scores: gameStorage.getHighScores() };
    } else if (method === 'POST' && data) {
      const { score, playerName } = data as any;
      const scores = gameStorage.saveScore(score, playerName);
      responseData = { scores };
    }
    
    // Return a mock response with local storage data
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed: ${fullUrl}`, error);
    
    // For static mode, return empty successful response to avoid breaking the app
    if (isStaticMode) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

// Query function for React Query
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Special handling for high scores in static mode
    if (isStaticMode && url.includes('high-scores')) {
      return { scores: gameStorage.getHighScores() };
    }
    
    try {
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
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      
      // For static mode, return null to avoid breaking the app
      if (isStaticMode) {
        return null;
      }
      throw error;
    }
  };

// Create the query client
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
