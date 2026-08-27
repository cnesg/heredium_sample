"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sparkline from "./Sparkline";

type Riser = {
  slug: string;
  en: string;
  lots: number;
  houses: string[];
  currency: string | null;
  medianPrice: number | null;
  r24: { lots: number; sold: number; band: number | null };
};

type Cross = {
  slug: string;
  ko: string;
  en: string;
  domesticLots: number;
  intlLots: number;
  intlSold: number;
  houses: string[];
  currency: string | null;
  medianPrice: number | null;
  band: number | null;
  lastSale: string;
};

type Data = {
  meta: {
    lotCount: number;
    artistCount: number;
    coverage: [string, string];
    houses: string[];
    basisBaselines: Record<string, number>;
  };
  risers: Riser[];
  months: { m: string; lots: number; sold: number }[];
  abroad: Cross[];
  seoulNow: Cross[];
};

function fmt(v: number | null | undefined, currency: string | null): string {
  if (v == null) return "—";
  const sym: Record<string, string> = {
    USD: "$", GBP: "£", EUR: "€", HKD: "HK$", AUD: "A$", CHF: "CHF ", CNY: "¥",
  };
  const s = sym[currency ?? ""] ?? `${currency ?? ""} `;
  if (v >= 1_000_000) return `${s}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1000) return `${s}${Math.round(v / 1000)}K`;
  return `${s}${Math.round(v).toLocaleString("en-US")}`;
}

function bandWord(b: number | null): string {
  if (b == null) return "—";
  if (b >= 0.8) return "추정가 크게 상회";
  if (b >= 0.35) return "추정가 상회";
  if (b >= 0.1) return "평균 이상";
  if (b > -0.1) return "평균";
  if (b > -0.4) return "평균 이하";
  return "추정가 하회";
}

function CrossTable({ rows, kind }: { rows: Cross[]; kind: "abroad" | "seoul" }) {
  if (rows.length === 0) return <p className="emptyNote">해당하는 작가가 없습니다.</p>;

  return (
    <div className="tableWrap">
      <table className="dataTable">
        <thead>
          <tr>
            <th>작가</th>
            <th>{kind === "abroad" ? "해외 낙찰" : "국내 출품"}</th>
            <th>중앙값</th>
            <th>추정가 대비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug}>
              <td>
                <Link href={`/artist/${encodeURIComponent(r.slug)}`}>
                  <strong>{r.ko}</strong>
                </Link>
                <span style={{ display: "block", fontSize: 11, color: "var(--ink-35)" }}>
                  {r.en} · {r.houses.join(" · ")}
                </span>
              </td>
              <td className="num">
                {kind === "abroad" ? r.intlSold : r.domesticLots}점
                <span style={{ display: "block", fontSize: 11, color: "var(--ink-35)" }}>
                  {kind === "abroad" ? `국내 ${r.domesticLots}점` : `해외 ${r.intlSold}점`}
                </span>
              </td>
              <td className="num">{fmt(r.medianPrice, r.currency)}</td>
              <td>
                <span className="badge badge--quiet">{bandWord(r.band)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IntlMarket() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/market?scope=intl")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div aria-busy="true">
        <span className="skeleton" style={{ width: "68%" }} />
        <span className="skeleton" style={{ width: "44%" }} />
      </div>
    );
  }

  const months = data.months.slice(-25, -1);
  const last = months[months.length - 1];

  return (
    <>
      <div className="statGrid" style={{ marginBottom: 20 }}>
        <div className="stat">
          <span className="statLabel">집계 규모</span>
          <span className="statValue">
            {Math.round(data.meta.lotCount / 1000).toLocaleString("ko-KR")}
            <span className="statUnit">천 점</span>
          </span>
          <span className="statNote">
            작가 {data.meta.artistCount.toLocaleString("ko-KR")}명 · {data.meta.houses.join(" · ")}
          </span>
        </div>
        <div className="stat">
          <span className="statLabel">월 출품 수 추이</span>
          <Sparkline
            values={months.map((m) => m.lots)}
            width={150}
            height={38}
            label="최근 24개월 월별 출품 수"
          />
          <span className="statNote">
            최근 24개월 · 마지막 달 {last?.lots.toLocaleString("ko-KR")}점
          </span>
        </div>
        <div className="stat">
          <span className="statLabel">낙찰률</span>
          <span className="statValue">
            {Math.round(
              (months.reduce((s, m) => s + m.sold, 0) /
                Math.max(1, months.reduce((s, m) => s + m.lots, 0))) *
                100
            )}
            <span className="statUnit">%</span>
          </span>
          <span className="statNote">최근 24개월 합산</span>
        </div>
      </div>

      <div className="caveat" style={{ marginBottom: 24 }}>
        <strong>통화도 가격 정의도 섞여 있습니다.</strong> 이 데이터에는 GBP·USD·EUR·HKD가
        함께 있고 믿을 만한 환산이 없어 <strong>금액은 절대 합산하지 않습니다</strong> — 작가마다
        가장 많이 쓰인 통화로만 표시합니다. 또 본햄스·소더비는 해머가, 크리스티는 수수료
        포함가입니다. 그래서 순위는 금액이 아니라 <strong>낙찰가가 그 작품의 추정가 구간
        어디에 떨어졌는가</strong>로 매깁니다. 이 값은 통화와 무관하고, 두 가격 정의의
        구조적 차이(기준선 {data.meta.basisBaselines.hammer} 대{" "}
        {data.meta.basisBaselines.premium})를 각각 빼서 맞춰 뒀습니다.
      </div>

      <div className="sectionHead">
        <h3 className="sectionTitle">한국 작가, 해외 경매에서</h3>
        <span className="sectionNote">국내·해외 기록이 모두 있는 작가</span>
      </div>
      <CrossTable rows={data.abroad} kind="abroad" />
      <p className="statNote" style={{ margin: "10px 0 28px" }}>
        국내 매체는 국내 경매만 다루고 해외 데이터베이스는 영문명만 쓰기 때문에, 이 교차
        지점은 어느 한쪽 자료만으로는 만들 수 없습니다. 두 기록을 잇는 열쇠는 서울옥션이
        작가명을 국문·영문으로 나란히 싣는다는 사실뿐입니다.
      </p>

      <div className="sectionHead">
        <h3 className="sectionTitle">해외 작가, 국내 경매에서</h3>
        <span className="sectionNote">국내 출품이 많은 순</span>
      </div>
      <CrossTable rows={data.seoulNow} kind="seoul" />

      <div className="sectionHead" style={{ marginTop: 28 }}>
        <h3 className="sectionTitle">해외 급상승</h3>
        <span className="sectionNote">최근 24개월 · 5점 이상 낙찰</span>
      </div>
      <ol className="trendList">
        {data.risers.slice(0, 10).map((r, i) => (
          <li key={r.slug}>
            <Link className="trendRow" href={`/artist/${encodeURIComponent(r.slug)}`}>
              <span className="trendRank num">{i + 1}</span>
              <span className="trendMain">
                <span className="trendName">{r.en}</span>
                <span className="trendSub">
                  최근 {r.r24.sold}점 낙찰 · 중앙값 {fmt(r.medianPrice, r.currency)} ·{" "}
                  {r.houses.join(" · ")}
                </span>
              </span>
              <span className="trendRight">
                <span className="badge">{bandWord(r.r24.band)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
