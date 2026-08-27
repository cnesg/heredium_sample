"use client";

import { useEffect, useState } from "react";
import type { FairRow } from "@/app/api/fairs/route";
import type { Scope } from "@/lib/data";

export default function FairsSection({ scope, limit = 10 }: { scope?: Scope; limit?: number }) {
  const [fairs, setFairs] = useState<FairRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    setFairs(null);
    const q = new URLSearchParams({ limit: String(limit) });
    if (scope) q.set("scope", scope);

    fetch(`/api/fairs?${q}`)
      .then((r) => r.json())
      .then((d) => alive && setFairs(d.fairs ?? []))
      .catch(() => alive && setFairs([]));

    return () => {
      alive = false;
    };
  }, [scope, limit]);

  if (!fairs) {
    return (
      <div className="fairRail" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="fairCard" aria-hidden="true">
            <span className="skeleton" style={{ width: "46%", height: 10 }} />
            <span className="skeleton" style={{ width: "84%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (fairs.length === 0) {
    return <p className="emptyNote">다가오는 행사가 없습니다.</p>;
  }

  return (
    <div className="fairRail">
      {fairs.map((f) => {
        const cls = [
          "fairCard",
          f.status === "ongoing" ? "fairCard--ongoing" : "",
          f.status === "tba" ? "fairCard--tba" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const when =
          f.status === "ongoing"
            ? "진행 중"
            : f.status === "tba"
              ? "일정 미정"
              : f.daysUntil != null && f.daysUntil <= 60
                ? `${f.daysUntil}일 뒤`
                : f.dates;

        const body = (
          <>
            <span className="fairWhen">{when}</span>
            <span className="fairName">{f.nameKo ?? f.name}</span>
            <span className="fairWhere">
              {f.city}
              {f.venue ? ` · ${f.venue}` : ""}
              {f.status !== "tba" && when !== f.dates ? ` · ${f.dates}` : ""}
            </span>
            {f.note && <span className="fairNote">{f.note}</span>}
          </>
        );

        return f.url ? (
          <a key={f.id} className={cls} href={f.url} target="_blank" rel="noopener noreferrer">
            {body}
          </a>
        ) : (
          <div key={f.id} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
