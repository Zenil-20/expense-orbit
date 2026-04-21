import { useEffect, useRef, useState } from "react";

export default function useContainerWidth(min = 260) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(min, Math.round(e.contentRect.width));
        setWidth(w);
      }
    });
    ro.observe(el);
    setWidth(Math.max(min, el.clientWidth || min));
    return () => ro.disconnect();
  }, [min]);

  return [ref, width];
}
