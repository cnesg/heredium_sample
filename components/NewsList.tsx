"use client";

import { useEffect, useState } from "react";
import type { Scope } from "@/lib/data";

type Article = {
  title: string;
  summary: string;
  url: string;
  source: string;
  date: string;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; articles: Article[] }
  | { kind: "empty"; note?: string };

function ago(date: string): string {
  const diff = Date.now() - Date.parse(date + "T09:00:00+09:00");
  const day = Math.round(diff / 86400000);
  if (day <= 0) return "오늘";
  if (day === 1) return "어제";
  if (day < 7) return `${day}일 전`;
  const [, m, d] = date.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export default function NewsList({ scope }: { scope: Scope }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });

    fetch(`/api/news?scope=${scope}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const articles: Article[] = data.articles ?? [];
        setState(
          articles.length
            ? { kind: "ready", articles }
            : { kind: "empty", note: data.note }
        );
      })
      .catch(() => alive && setState({ kind: "empty" }));

    return () => {
      alive = false;
    };
  }, [scope]);

  if (state.kind === "loading") {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="srOnly">뉴스를 불러오는 중입니다</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="newsItem" aria-hidden="true">
            <span className="skeleton" style={{ width: "94%" }} />
            <span className="skeleton" style={{ width: "38%", height: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  if (state.kind === "empty") {
    return <p className="emptyNote">{state.note ?? "지금은 기사를 불러올 수 없습니다."}</p>;
  }

  return (
    <div aria-live="polite">
      {state.articles.slice(0, 8).map((a) => (
        <a
          key={a.url}
          className="newsItem"
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="newsTitle">{a.title}</span>
          {a.summary && <span className="newsSummary">{a.summary}</span>}
          <span className="newsMeta">
            {a.source} · {ago(a.date)}
          </span>
        </a>
      ))}
    </div>
  );
}
