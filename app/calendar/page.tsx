"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import type { FairRow } from "@/app/api/fairs/route";
import type { Scope } from "@/lib/data";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const KIND_LABEL: Record<string, string> = {
  fair: "페어",
  biennale: "비엔날레",
  photo: "사진",
  design: "디자인",
  book: "북페어",
};

export default function CalendarPage() {
  const [scope, setScope] = useState<Scope | undefined>(undefined);
  const [fairs, setFairs] = useState<FairRow[] | null>(null);
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  useEffect(() => {
    let alive = true;
    setFairs(null);
    const q = scope ? `?scope=${scope}` : "";
    fetch(`/api/fairs${q}`)
      .then((r) => r.json())
      .then((d) => alive && setFairs(d.fairs ?? []))
      .catch(() => alive && setFairs([]));
    return () => {
      alive = false;
    };
  }, [scope]);

  const dated = (fairs ?? []).filter((f) => f.start);
  const tba = (fairs ?? []).filter((f) => !f.start);

  const byMonth = new Map<string, FairRow[]>();
  for (const f of dated) {
    const k = f.start!.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), f]);
  }

  return (
    <>
      <TopBar onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        <h1 className="pageTitle">아트 캘린더</h1>
        <p className="pageIntro">
          2026년 주요 아트페어와 비엔날레. 아직 일정을 발표하지 않은 행사는 날짜를
          추정하지 않고 아래 &lsquo;일정 미정&rsquo;에 따로 모아 뒀습니다.
        </p>

        <div className="chipRow" style={{ marginTop: 20 }}>
          {(
            [
              [undefined, "전체"],
              ["kr", "국내"],
              ["intl", "해외"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={label}
              type="button"
              className="chip"
              aria-pressed={scope === v}
              onClick={() => setScope(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {fairs === null ? (
          <div aria-busy="true" style={{ marginTop: 30 }}>
            <span className="skeleton" style={{ width: "34%", height: 18 }} />
            <span className="skeleton" style={{ width: "80%" }} />
            <span className="skeleton" style={{ width: "66%" }} />
          </div>
        ) : (
          <>
            {[...byMonth.entries()].map(([month, rows]) => (
              <div key={month} className="calMonth">
                <div className="calMonthLabel">
                  {MONTHS[Number(month.slice(5, 7)) - 1]}
                  <div style={{ fontSize: 12, color: "var(--ink-35)" }}>{month.slice(0, 4)}</div>
                </div>
                <div>
                  {rows.map((f) => {
                    const inner = (
                      <>
                        <span className="calDates">
                          {f.dates}
                          {f.status === "ongoing" && (
                            <span className="badge" style={{ marginLeft: 8 }}>
                              진행 중
                            </span>
                          )}
                        </span>
                        <span>
                          <span className="fairName" style={{ display: "block" }}>
                            {f.nameKo ? `${f.nameKo} · ${f.name}` : f.name}
                          </span>
                          <span className="fairWhere">
                            {f.city}
                            {f.venue ? ` · ${f.venue}` : ""} · {KIND_LABEL[f.kind] ?? f.kind}
                          </span>
                          {f.note && <span className="fairNote">{f.note}</span>}
                        </span>
                      </>
                    );
                    return f.url ? (
                      <a
                        key={f.id}
                        className="calItem"
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={f.id} className="calItem">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {tba.length > 0 && (
              <div className="calMonth">
                <div className="calMonthLabel" style={{ fontSize: 15 }}>
                  일정 미정
                </div>
                <div>
                  {tba.map((f) => (
                    <div key={f.id} className="calItem">
                      <span className="calDates" style={{ fontStyle: "italic", color: "var(--ink-35)" }}>
                        미발표
                      </span>
                      <span>
                        <span className="fairName" style={{ display: "block" }}>
                          {f.nameKo ? `${f.nameKo} · ${f.name}` : f.name}
                        </span>
                        <span className="fairWhere">
                          {f.city}
                          {f.venue ? ` · ${f.venue}` : ""}
                        </span>
                        <span className="fairNote">{f.dates}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <footer className="footer">
          날짜는 2026년 8월 조사 시점 기준입니다. 페어 일정은 바뀔 수 있으니 방문 전
          공식 페이지에서 확인해 주세요.
          <br />
          <Link href="/sources">수집 소스 전체 보기</Link>
        </footer>
      </main>

      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
