import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

export function useSplitwise() {
  const [data, setData] = useState({ expenses: [], summary: { youAreOwed: 0, youOwe: 0, net: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.splitwiseList();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { ...data, loading, error, reload };
}
