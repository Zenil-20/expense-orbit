/**
 * Build a Mongoose `{ date: { $gte, $lte } }` filter from the standard
 * `filter`/`startDate`/`endDate` query params. All boundaries are computed in
 * the process timezone (which the app pins to Asia/Kolkata in server.js).
 *
 * Returns:
 *   { dateFilter, rangeLabel, rangeStart, rangeEnd }  on success
 *   { error: "…" }                                    on invalid input
 *
 * For filter === "all" (or omitted), returns an empty dateFilter so callers
 * get every expense back.
 */
function buildDateFilter({ filter, startDate, endDate }) {
  const today = new Date();

  if (!filter || filter === "all") {
    return { dateFilter: {}, rangeLabel: "All time", rangeStart: null, rangeEnd: null };
  }

  let start, end, rangeLabel;

  if (filter === "monthly") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    rangeLabel = "This month";
  } else if (filter === "yearly") {
    start = new Date(today.getFullYear(), 0, 1);
    end = new Date(today.getFullYear(), 11, 31);
    rangeLabel = "This year";
  } else if (filter === "weekly") {
    const first = new Date(today);
    first.setDate(first.getDate() - first.getDay());
    start = first;
    end = new Date(first);
    end.setDate(end.getDate() + 6);
    rangeLabel = "This week";
  } else if (filter === "daily") {
    start = new Date(today);
    end = new Date(today);
    rangeLabel = "Today";
  } else if (filter === "custom") {
    if (!startDate || !endDate) {
      return { error: "Start date and end date are required for custom filter" };
    }
    start = new Date(startDate);
    end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: "Invalid date format for custom filter" };
    }
    if (start > end) {
      return { error: "Start date cannot be after end date" };
    }
    rangeLabel = `${formatISO(start)} → ${formatISO(end)}`;
  } else {
    return { error: "Invalid filter type (use daily, weekly, monthly, yearly, custom)" };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    dateFilter: { date: { $gte: start, $lte: end } },
    rangeLabel,
    rangeStart: start,
    rangeEnd: end,
  };
}

function formatISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

module.exports = { buildDateFilter };
