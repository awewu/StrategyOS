"use client";

import { useEffect, useState } from "react";

export function InboxNavBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/inbox/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { open?: number } | null) => {
        if (j && typeof j.open === "number") setCount(j.open);
      })
      .catch(() => undefined);
  }, []);

  if (count == null || count <= 0) return null;

  return (
    <span className="stratos-nav-badge" aria-label={`${count} 条待处理议题`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
