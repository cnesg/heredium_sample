"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scope } from "@/lib/data";

import type { TrendRow } from "@/app/api/trending/route";

type State = { kind: "loading" } | { kind: "empty" } | { kind: "ready"; rows: TrendRow[] };

/**
 * 트렌딩 작가. Supabase 언급 signals가 있으면 그게 1순위지만, 크론이 며칠 돌아야
 * 쌓이기 때문에 갤러리 아카이브 기반 순위를 항상 함께 쓴다.
 */
export default function TrendingList({ scope, limit = 10 }: { scope: Scope; limit?: number }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });

    fetch(`/api/trending?scope=${scope}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const rows: TrendRow[] = data.trending ?? [];
        setState(rows.length ? { kind: "ready", rows } : { kind: "empty" });
      })
      .catch(() => alive && setState({ kind: "empty" }));

    return () => {
      alive = false;
    };
  }, [scope, limit]);

  if (state.kind === "loading") {
    return (
      <ol className="trendList" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} aria-hidden="true">
            <div className="trendRow">
              <span className="skeleton" style={{ width: "48%" }} />
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (state.kind === "empty") {
    return (
      <div className="emptyBox">
        아직 이 범위에서 잡히는 작가가 없습니다. 갤러리 소식과 언급이 하루이틀 쌓이면
        이 자리에 실제 순위가 나타납니다.
      </div>
    );
  }

  return (
    <ol className="trendList">
      {state.rows.map((r, i) => (
        <li key={r.key}>
          <Link className="trendRow" href={r.href}>
            <span className="trendRank num">{i + 1}</span>
            <span className="trendMain">
              <span className="trendName">{r.name}</span>
              <span className="trendSub">{r.reason}</span>
            </span>
            <span className="trendRight">
              {r.marketScore !== null && r.marketScore > 0 && (
                <span className="badge" title="최근 24개월 경매 활동 기준">
                  경매 {r.marketScore}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
