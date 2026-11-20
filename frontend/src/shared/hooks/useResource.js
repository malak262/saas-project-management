import { useEffect, useRef, useState, useCallback } from "react";
export function useResource(loader, dependencies = [], poll = 0) {
  const fn = useRef(loader);
  fn.current = loader;
  const sequence = useRef(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const reload = useCallback(async (quiet = false) => {
    const current = ++sequence.current;
    setState((s) => ({ ...s, loading: !quiet && !s.data, error: null }));
    try {
      const data = await fn.current();
      if (current === sequence.current)
        setState({ data, loading: false, error: null });
    } catch (error) {
      if (current === sequence.current) {
        if (quiet)
          window.dispatchEvent(
            new CustomEvent("teamflow:sync-error", { detail: error.message }),
          );
        setState((s) => ({
          ...s,
          loading: false,
          error: quiet && s.data ? null : error,
        }));
      }
    }
  }, []);
  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    reload();
    const listener = () => reload(true);
    window.addEventListener("teamflow:refresh", listener);
    const timer = poll
      ? setInterval(() => {
          if (!document.hidden) reload(true);
        }, poll)
      : null;
    return () => {
      ++sequence.current;
      window.removeEventListener("teamflow:refresh", listener);
      if (timer) clearInterval(timer);
    };
  }, [reload, poll, ...dependencies]);
  return { ...state, reload };
}
