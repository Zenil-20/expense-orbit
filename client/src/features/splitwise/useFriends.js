import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

export function useFriends() {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.friendsList();
      setData(res);
    } catch {
      setData({ friends: [], incoming: [], outgoing: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { ...data, loading, reload };
}
