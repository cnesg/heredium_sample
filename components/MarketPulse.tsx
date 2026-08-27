"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sparkline from "./Sparkline";

type Riser = {
  slug: string;
  en: string;
  ko: string | null;
  lots: number;
  medianHammer: number | null;
  r24: { lots: number; sold: number; band: number | null };
};

type Notable = {
  slug: string;
  artist: string;
  artistKo: string | null;
  date: string;
  title: string | null;
  hammer: number;
  estLow: number;
  estHigh: number;
  band: number;
  house: string;
};

type Month = { m: string; lots: number; sold: number; hammer: number };

type Data = {
  meta: { lotCount: number; artistCount: number; coverage: [string, string]; houses: string[] };
  risers: Riser[];
  notable: Notable[];
  months: Month[];
};

function krw(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1e8) {
    const e = v / 1e8;
    return `${e >= 10 ? Math.round(e) : e.toFixed(1).replace(/\.0$/, "")}억`;
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString("ko-KR")}만`;
  return v.toLocaleString("ko-KR");
}

function band(b: number | null): string {
  if (b == null) return "—";
  if (b >= 1) return "추정가 상단 돌파";
  if (b >= 0.5) return "추정가 상단권";
  if (b > 0.05) return "추정가 중간권";
  if (b >= -0.05) return "추정가 하한";
  return "추정가 하한 아래";
}

/** 홈에 얹는 국내 경매 요약. 상세는 /market. */
export default function MarketPulse({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div aria-busy="true">
        <span className="skeleton" style={{ width: "70%" }} />
        <span className="skeleton" style={{ width: "52%" }} />
      </div>
    );
  }

  // 마지막 달은 아직 진행 중이라 낙찰률이 실제보다 낮게 잡힌다(집계 시점 이후의
  // 경매가 아직 안 열렸다). 완결된 직전 달을 기준으로 쓴다.
  const months = data.months.slice(-14);
  const closed = months[months.length - 2] ?? months[months.length - 1];
  const sellThrough = closed ? Math.round((closed.sold / Math.max(1, closed.lots)) * 100) : 0;
  const [y, m] = (closed?.m ?? "--").split("-");

  return (
    <>
      {!compact && (
        <div className="statGrid" style={{ marginBottom: 20 }}>
          <div className="stat">
            <span className="statLabel">
              {y}년 {Number(m)}월 낙찰률
            </span>
            <span className="statValue">
              {sellThrough}
              <span className="statUnit">%</span>
            </span>
            <span className="statNote">
              출품 {closed?.lots.toLocaleString("ko-KR")}점 중 {closed?.sold.toLocaleString("ko-KR")}점 낙찰
            </span>
          </div>
          <div className="stat">
            <span className="statLabel">월 낙찰총액 추이</span>
            <Sparkline
              values={months.slice(0, -1).map((mm) => mm.hammer)}
              width={140}
              height={38}
              label="최근 13개월 낙찰총액"
            />
            <span className="statNote">
              최근 13개월 · {Number(m)}월 {krw(closed?.hammer)}
            </span>
          </div>
          <div className="stat">
            <span className="statLabel">집계 규모</span>
            <span className="statValue">
              {data.meta.lotCount.toLocaleString("ko-KR")}
              <span className="statUnit">점</span>
            </span>
            <span className="statNote">
              작가 {data.meta.artistCount.toLocaleString("ko-KR")}명 ·{" "}
              {data.meta.coverage[0].slice(0, 4)}년부터 · {data.meta.houses.join(" · ")}
            </span>
          </div>
        </div>
      )}

      <div className="split" style={{ gap: 36 }}>
        <div>
          <div className="sectionHead" style={{ paddingTop: 0 }}>
            <h3 className="sectionTitle">추정가를 넘긴 이름</h3>
            <span className="sectionNote">최근 24개월 · 4점 이상 낙찰</span>
          </div>
          <ol className="trendList">
            {data.risers.slice(0, compact ? 5 : 8).map((r, i) => (
              <li key={r.slug}>
                <Link className="trendRow" href={`/artist/${encodeURIComponent(r.slug)}`}>
                  <span className="trendRank num">{i + 1}</span>
                  <span className="trendMain">
                    <span className="trendName">{r.ko ?? r.en}</span>
                    <span className="trendSub">
                      최근 {r.r24.sold}점 낙찰 · 중앙값 {krw(r.medianHammer)}
                    </span>
                  </span>
                  <span className="trendRight">
                    <span className="badge">{band(r.r24.band)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="sectionHead" style={{ paddingTop: 0 }}>
            <h3 className="sectionTitle">눈에 띈 낙찰</h3>
            <span className="sectionNote">추정가 상단 초과</span>
          </div>
          {data.notable.slice(0, compact ? 4 : 6).map((n, i) => (
            <Link key={i} className="marketRow" href={`/artist/${encodeURIComponent(n.slug)}`}>
              <span className="marketArtist">{n.artistKo ?? n.artist}</span>
              <span className="marketWork">{n.title ?? "무제"}</span>
              <span className="marketPrice">{krw(n.hammer)}</span>
              <span className="marketEst">추정 {krw(n.estHigh)}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
