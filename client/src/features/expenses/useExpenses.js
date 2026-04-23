import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const PAGE_SIZE = 100;
const DEFAULT_RANGE = { preset: "all", startDate: "", endDate: "" };

function isCustomIncomplete(range) {
  return range.preset === "custom" && (!range.startDate || !range.endDate);
}

export function useExpenses(initialRange = DEFAULT_RANGE) {
  const [range, setRange] = useState(initialRange);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const rangeKey = useMemo(
    () => `${range.preset}|${range.startDate}|${range.endDate}`,
    [range.preset, range.startDate, range.endDate]
  );

  const fetchPage = useCallback(async (nextPage, replace) => {
    if (isCustomIncomplete(range)) {
      setExpenses([]); setHasMore(false); setError(null); setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (range.preset === "all") {
        const data = await api.expenses();
        setExpenses(Array.isArray(data) ? data : []);
        setHasMore(false);
      } else {
        const res = await api.filteredExpenses({
          filter: range.preset,
          startDate: range.startDate || undefined,
          endDate: range.endDate || undefined,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        const data = Array.isArray(res?.data) ? res.data : [];
        setExpenses((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      }
      setPage(nextPage);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchPage(1, true); /* eslint-disable-next-line */ }, [rangeKey]);

  const reload = useCallback(() => fetchPage(1, true), [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || range.preset === "all") return;
    fetchPage(page + 1, false);
  }, [fetchPage, hasMore, loading, page, range.preset]);

  return {
    expenses, loading, error,
    reload, setExpenses,
    range, setRange,
    loadMore, hasMore, page,
  };
}
