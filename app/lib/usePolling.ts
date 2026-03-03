import { useEffect, useRef, useCallback } from "react";

/**
 * Polls a URL at a fixed interval and calls `onData` with the JSON response.
 * Automatically cleans up on unmount.
 */
export function usePolling<T>(
  url: string | null,
  onData: (data: T) => void,
  intervalMs = 2000
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const poll = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        onDataRef.current(data);
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    // Poll immediately then at interval
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [url, intervalMs, poll]);
}
