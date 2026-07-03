import { useCallback, useEffect, useRef, useState } from "react";

export type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  setError: (message: string) => void;
};

/**
 * Owns the loading / error / reload state machine every page reimplemented by
 * hand. Pages declare *what* to fetch; the hook owns *how* the request is
 * tracked. Caching, retries, or request cancellation can be added here once
 * instead of in four places.
 */
export function useQuery<T>(fetcher: () => Promise<T>): QueryState<T> {
  // Keep the latest fetcher without re-running the effect when an inline
  // arrow changes identity on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setData(await fetcherRef.current());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setError };
}
