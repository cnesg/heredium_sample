"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import MarketPulse from "@/components/MarketPulse";
import IntlMarket from "@/components/IntlMarket";
import {
  REPORTS,
  HEADLINE_STATS,
  SEGMENTS,
  SEGMENT_VALUE_SHARES,
  INDICES,
  SECONDARY_BENCHMARKS,
  COMPARABILITY_NOTE,
  regionsByBasis,
  getReport,
  type HeadlineStat,
  type Segment,
} from "@/lib/marketReports";

function statValue(s: HeadlineStat): string {
  switch (s.unit) {
    case "USD_BN":
      return `$${s.value}bn`;
    case "USD_MN":
      return `$${s.value.toLocaleString("en-US")}m`;
    default:
      return `${s.value > 0 ? "+" : ""}${s.value}%`;
  }
}

/** 증감률을 색이 아니라 부호와 막대 길이로만 보여준다. */
function ChangeBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="sectionNote">—</span>;
  const w = Math.min(100, Math.abs(pct) * 1.6);
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <span className="num" style={{ fontSize: 13 }}>
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>
      <span
        className="barCell"
        style={{ width: `${w}px`, opacity: pct > 0 ? 1 : 0.4 }}
        aria-hidden="true"
      />
    </span>
  );
}

function SegmentTable({ rows, caption }: { rows: Segment[]; caption: string }) {
  return (
    <div className="tableWrap">
      <table className="dataTable">
        <caption className="srOnly">{caption}</caption>
        <thead>
          <tr>
            <th>가격 구간</th>
            <th>메모</th>
            <th>낙찰액 증감</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{s.band}</td>
              <td style={{ color: "var(--ink-50)", fontSize: 12 }}>{s.note ?? ""}</td>
              <td>
                <ChangeBar pct={s.valueChangePct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketPage() {
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  const totals = HEADLINE_STATS.filter((s) =>
    ["global-market-size-2025", "global-market-yoy-2025", "dealer-sales-2025"].includes(s.id)
  );

  return (
    <>
      <TopBar onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        <h1 className="pageTitle">시장</h1>
        <p className="pageIntro">
          국내는 서울옥션·케이옥션, 해외는 본햄스·크리스티·소더비의 낙찰 결과를 직접
          집계했습니다. 그 위에 Art Basel/UBS·Artprice·Artnet 연차 보고서의 매크로 지표를
          얹었습니다. 세 층위는 세는 대상이 서로 달라 나란히 두되 섞지 않습니다.
        </p>

        {/* ── 국내: 직접 집계 ───────────────────── */}
        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">국내 경매</h2>
            <span className="sectionNote">서울옥션 · 케이옥션 · 직접 집계</span>
          </div>
          <MarketPulse />
        </section>

        <section className="section">
          <div className="caveat">
            <strong>추정가 구간(band)을 읽는 법.</strong> 낙찰가가 그 작품의 추정가 하한이면
            0, 상한이면 1입니다. 국내 경매 전체의 중앙값이 정확히 <span className="num">0.0</span>
            이라, 하한에 걸려 낙찰되는 것이 이 시장의 정상입니다. 0을 넘긴다는 건 그 이름에
            대한 응찰이 평균보다 두터웠다는 뜻이지, 작품이 더 좋다는 뜻이 아닙니다. 비교는
            언제나 그 롯에 경매사가 매긴 추정가와만 이뤄지며, 다른 작가의 가격과는 견주지 않습니다.
          </div>
        </section>

        {/* ── 해외 경매: 직접 집계 ────────────────── */}
        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">해외 경매</h2>
            <span className="sectionNote">Bonhams · Christie&apos;s · Sotheby&apos;s · 직접 집계</span>
          </div>
          <IntlMarket />
        </section>

        {/* ── 글로벌 매크로 ──────────────────────── */}
        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">글로벌 시장 규모</h2>
            <span className="sectionNote">2025년 · Art Basel &amp; UBS</span>
          </div>

          <div className="statGrid">
            {totals.map((s) => (
              <div key={s.id} className="stat">
                <span className="statLabel">{s.label}</span>
                <span className="statValue">{statValue(s)}</span>
                {s.caveat && <span className="statNote">{s.caveat}</span>}
              </div>
            ))}
          </div>

          <div className="caveat" style={{ marginTop: 20 }}>
            <strong>총액을 비교하지 마세요.</strong> {COMPARABILITY_NOTE}
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">가격 구간별 흐름</h2>
            <span className="sectionNote">2025년 · 초고가 구간이 반기와 연간에서 정반대로 읽힌다</span>
          </div>

          <div className="split" style={{ gap: 36 }}>
            <div>
              <h3 className="sectionTitle" style={{ marginBottom: 10, fontSize: 13 }}>
                상반기 (Artnet)
              </h3>
              <SegmentTable rows={SEGMENTS.filter((s) => s.period === "H1")} caption="2025 상반기 가격 구간별 낙찰액 증감" />
            </div>
            <div>
              <h3 className="sectionTitle" style={{ marginBottom: 10, fontSize: 13 }}>
                연간 (Art Basel/UBS)
              </h3>
              <SegmentTable rows={SEGMENTS.filter((s) => s.period === "FY")} caption="2025 연간 가격 구간별 낙찰액 증감" />
            </div>
          </div>

          <div className="caveat" style={{ marginTop: 18 }}>
            같은 <strong>$10M 초과</strong> 구간이 상반기에는 −43.4%, 연간으로는 +30%입니다.
            모순이 아니라 시점 차이입니다 — 2025년의 대형 세일이 11월 뉴욕에 몰려 있었습니다.
            반기 수치 하나로 연간 흐름을 판단하면 정확히 반대 결론에 이릅니다.
          </div>

          <div style={{ marginTop: 22 }}>
            <h3 className="sectionTitle" style={{ marginBottom: 10, fontSize: 13 }}>
              낙찰액에서 차지하는 비중
            </h3>
            <div className="tableWrap">
              <table className="dataTable">
                <tbody>
                  {SEGMENT_VALUE_SHARES.map((s) => (
                    <tr key={s.band}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{s.band}</td>
                      <td style={{ color: "var(--ink-50)", fontSize: 12 }}>{s.note ?? ""}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <span className="num" style={{ fontSize: 13 }}>{s.sharePct}%</span>
                          <span className="barCell" style={{ width: `${s.sharePct}px` }} aria-hidden="true" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">지역별</h2>
            <span className="sectionNote">집계 기준이 다른 두 표 — 행을 섞어 읽지 않습니다</span>
          </div>

          <div className="split" style={{ gap: 36 }}>
            {(
              [
                ["total-market", "시장 전체 (딜러 포함) · Art Basel/UBS"],
                ["fine-art-auction", "파인아트 경매만 · Artprice"],
              ] as const
            ).map(([basis, title]) => {
              const rows = regionsByBasis(basis);
              const max = Math.max(...rows.map((r) => r.valueUsdMn));
              return (
                <div key={basis}>
                  <h3 className="sectionTitle" style={{ marginBottom: 10, fontSize: 13 }}>
                    {title}
                  </h3>
                  <div className="tableWrap">
                    <table className="dataTable">
                      <thead>
                        <tr>
                          <th>국가</th>
                          <th>규모</th>
                          <th>전년 대비</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td style={{ whiteSpace: "nowrap" }}>
                              <strong>{r.countryKo}</strong>
                              {r.sharePct !== null && (
                                <span className="sectionNote"> · {r.sharePct}%</span>
                              )}
                            </td>
                            <td>
                              <span className="num">
                                {r.valueUsdMn >= 1000
                                  ? `$${(r.valueUsdMn / 1000).toFixed(r.valueUsdMn % 1000 === 0 ? 0 : 2)}bn`
                                  : `$${r.valueUsdMn}m`}
                              </span>
                              <span
                                className="barCell"
                                style={{ width: `${(r.valueUsdMn / max) * 90}px`, marginTop: 5 }}
                                aria-hidden="true"
                              />
                            </td>
                            <td>
                              <ChangeBar pct={r.yoyPct} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">가격지수</h2>
            <span className="sectionNote">거래총액이 아니라 &lsquo;같은 작품의 값이 변했는가&rsquo;를 재는 지표</span>
          </div>

          <div className="galleryGrid">
            {INDICES.map((idx) => (
              <div key={idx.id} className="reportCard">
                <h3 className="reportTitle">{idx.name}</h3>
                <p className="reportMeta">
                  {idx.provider} · {idx.freeLiveFeed ? "무료 공개 시계열 있음" : "공개 시계열 없음"}
                </p>
                <p className="reportScope">{idx.measures}</p>
                {idx.figures && idx.figures.length > 0 && (
                  <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                    {idx.figures.map((f) => (
                      <li
                        key={f.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          fontSize: 12,
                          padding: "5px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <span style={{ color: "var(--ink-50)" }}>{f.label}</span>
                        <span className="num">{f.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="statNote" style={{ marginTop: 12 }}>
                  <strong style={{ color: "var(--ink-70)" }}>한계.</strong> {idx.limits}
                </p>
              </div>
            ))}
          </div>

          <div className="caveat" style={{ marginTop: 20 }}>
            <strong>아래 수치는 2차 출처입니다.</strong> 널리 인용되지만 하나의 원 연구로
            추적되지 않는 값들입니다.
            <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {SECONDARY_BENCHMARKS.map((b) => (
                <li key={b.id} style={{ marginBottom: 5 }}>
                  {b.label} — <span className="num">{b.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">출처</h2>
            <span className="sectionNote">각 보고서가 무엇을 세고 무엇을 빼는지</span>
          </div>
          <div className="galleryGrid">
            {REPORTS.map((r) => (
              <div key={r.id} className="reportCard">
                <h3 className="reportTitle">{r.title}</h3>
                <p className="reportMeta">
                  {r.publisher} · {r.year}년 데이터
                </p>
                <p className="reportScope">
                  <strong style={{ color: "var(--ink)" }}>포함.</strong> {r.scopeIncludes}
                </p>
                <p className="reportScope" style={{ marginTop: 8 }}>
                  <strong style={{ color: "var(--ink)" }}>제외.</strong> {r.scopeExcludes}
                </p>
                <p className="statNote" style={{ marginTop: 10 }}>{r.howToRead}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          여기의 수치는 과거 거래 기록이며 투자 자문이 아닙니다. 특정 작품이나 작가의 가격을
          예측하지 않습니다.
          <br />
          글로벌 지표는 {getReport("art-basel-ubs-2026")?.year}년 데이터 기준입니다.
          국내 집계는 리포지토리에 동봉된 인덱스를 갱신할 때마다 새로 계산됩니다.
          <br />
          <Link href="/sources">수집 소스 전체 보기</Link>
        </footer>
      </main>

      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
