"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import Sparkline from "@/components/Sparkline";
import { KIND_LABEL } from "@/lib/galleries";
import type { GalleryItem } from "@/lib/gallerySheet";
import type { MarketArtist } from "@/lib/market";
import type { IntlArtist } from "@/lib/intlMarket";

type Payload = {
  artist: {
    id: string;
    nameKo: string | null;
    nameEn: string | null;
    nationality: string | null;
    tier: string | null;
    photo: string | null;
  };
  why: { headline: string; points: string[] };
  intl: IntlArtist | null;
  market: (MarketArtist & { score: number }) | null;
  gallery: { n: number; galleries: string[]; last: string } | null;
  galleryItems: GalleryItem[];
  mentions: { headline: string; url: string | null; source: string; occurredOn: string; axis: string }[];
  error?: string;
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

const BASIS_KO: Record<string, string> = { hammer: "해머가", premium: "수수료 포함가" };

/** 해외는 통화가 섞이므로 반드시 통화 기호를 붙인다. */
function fmtIntl(v: number | null | undefined, currency: string | null): string {
  if (v == null) return "—";
  const sym: Record<string, string> = {
    USD: "$", GBP: "£", EUR: "€", HKD: "HK$", AUD: "A$", CHF: "CHF ", CNY: "¥",
  };
  const s = sym[currency ?? ""] ?? `${currency ?? ""} `;
  if (v >= 1_000_000) return `${s}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1000) return `${s}${Math.round(v / 1000)}K`;
  return `${s}${Math.round(v).toLocaleString("en-US")}`;
}

function band(b: number | null): string | null {
  if (b == null) return null;
  if (b >= 1) return "추정가 상단 돌파";
  if (b >= 0.5) return "추정가 상단권";
  if (b > 0.05) return "추정가 중간권";
  if (b >= -0.05) return "추정가 하한";
  return "추정가 하한 아래";
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  useEffect(() => {
    fetch(`/api/artist/${id}`)
      .then((r) => r.json())
      .then((d) => (d.error || !d.artist ? setFailed(true) : setData(d)))
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) {
    return (
      <>
        <TopBar />
        <main className="shell narrow">
          <p className="emptyBox" style={{ marginTop: 40 }}>
            이 작가의 자료를 찾지 못했습니다. 수집된 갤러리 소식이나 국내 경매 기록에 아직
            이름이 없을 수 있습니다.
          </p>
          <Link href="/artists" className="backLink">
            ← 작가 목록으로
          </Link>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar />
        <main className="shell narrow" aria-busy="true">
          <div style={{ paddingTop: 40 }}>
            <span className="skeleton" style={{ width: "44%", height: 28 }} />
            <span className="skeleton" style={{ width: "88%", marginTop: 16 }} />
            <span className="skeleton" style={{ width: "72%" }} />
          </div>
        </main>
      </>
    );
  }

  const { artist, market, gallery, galleryItems, mentions, why, intl } = data;
  const name = artist.nameKo ?? artist.nameEn ?? "이름 미상";
  const series = market?.series ?? [];

  return (
    <>
      <TopBar onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        <div className="artistHead">
          {artist.photo ? (
            <img className="artistPhoto" src={artist.photo} alt="" />
          ) : (
            <span className="artistPhoto artistPhoto--blank" aria-hidden="true">
              {name.slice(0, 1)}
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 className="artistName">{name}</h1>
            {artist.nameEn && artist.nameEn !== name && (
              <p className="artistNameEn">{artist.nameEn}</p>
            )}
            <div className="artistTags">
              {gallery && (
                <span className="badge badge--quiet">
                  갤러리 소식 {gallery.n}건 · {gallery.galleries.length}곳
                </span>
              )}
              {market && (
                <span className="badge badge--quiet">
                  국내 경매 {market.lots}점 · 낙찰률{" "}
                  {Math.round((market.sold / market.lots) * 100)}%
                </span>
              )}
              {market && market.score > 0 && (
                <span className="badge" title="최근 24개월 낙찰 활동·추정가 성과·낙찰률">
                  시장 활동 {market.score}
                </span>
              )}
              {intl && intl.sold > 0 && (
                <span className="badge badge--quiet">
                  해외 경매 {intl.sold}점 · {intl.houses.length}개 경매사
                </span>
              )}
              {mentions.length > 0 && (
                <span className="badge badge--quiet">최근 90일 언급 {mentions.length}건</span>
              )}
            </div>
          </div>
        </div>

        <section className="section" aria-labelledby="why">
          <div className="sectionHead">
            <h2 className="sectionTitle" id="why">
              왜 지금 여기 있나
            </h2>
            <span className="sectionNote">수집한 데이터에서 직접 센 근거</span>
          </div>
          <ul className="whyList">
            {why.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>

        {market && (
          <section className="section">
            <div className="sectionHead">
              <h2 className="sectionTitle">국내 경매 기록</h2>
              <span className="sectionNote">서울옥션 · 케이옥션 · {market.lastSale}까지</span>
            </div>

            <div className="statGrid" style={{ marginBottom: 20 }}>
              <div className="stat">
                <span className="statLabel">낙찰가 중앙값</span>
                <span className="statValue">{krw(market.medianHammer)}</span>
                <span className="statNote">낙찰 {market.sold}점 기준</span>
              </div>
              {series.length >= 2 && (
                <div className="stat">
                  <span className="statLabel">연도별 중앙값</span>
                  <Sparkline
                    values={series.map((s) => s.med)}
                    width={150}
                    height={40}
                    label={`${series[0].y}년부터 ${series[series.length - 1].y}년까지 낙찰가 중앙값 추이`}
                  />
                  <span className="statNote">
                    {series[0].y}–{series[series.length - 1].y} · 연 2점 이상 낙찰된 해만
                  </span>
                </div>
              )}
              <div className="stat">
                <span className="statLabel">최근 24개월</span>
                <span className="statValue">
                  {market.r24.sold}
                  <span className="statUnit">점 낙찰</span>
                </span>
                <span className="statNote">
                  출품 {market.r24.lots}점
                  {band(market.r24.band) ? ` · ${band(market.r24.band)}` : ""}
                </span>
              </div>
            </div>

            <div className="tableWrap">
              <table className="lotTable">
                <caption className="srOnly">{name}의 최근 출품 기록</caption>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>작품</th>
                    <th>추정가</th>
                    <th>낙찰가</th>
                  </tr>
                </thead>
                <tbody>
                  {market.recent.map((l, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "nowrap", color: "var(--ink-35)" }}>{l.date}</td>
                      <td>
                        {l.title ?? "무제"}
                        <span
                          style={{ display: "block", fontSize: 11, color: "var(--ink-35)" }}
                        >
                          {[l.medium, l.year, l.house, l.sale].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                      <td className="num" style={{ color: "var(--ink-50)", whiteSpace: "nowrap" }}>
                        {krw(l.estLow)}–{krw(l.estHigh)}
                      </td>
                      <td className="num">{l.sold ? krw(l.hammer) : "유찰"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="statNote" style={{ marginTop: 12 }}>
              낙찰가는 수수료를 제외한 해머 가격입니다. 성과는 언제나 그 롯에 경매사가 매긴
              추정가와만 비교하며, 다른 작가의 가격과는 견주지 않습니다.
            </p>
          </section>
        )}

        {intl && intl.sold > 0 && (
          <section className="section">
            <div className="sectionHead">
              <h2 className="sectionTitle">해외 경매 기록</h2>
              <span className="sectionNote">
                {intl.houses.join(" · ")} · {intl.lastSale}까지
              </span>
            </div>

            <div className="statGrid" style={{ marginBottom: 20 }}>
              <div className="stat">
                <span className="statLabel">낙찰가 중앙값</span>
                <span className="statValue">{fmtIntl(intl.medianPrice, intl.currency)}</span>
                <span className="statNote">
                  {intl.sold}점 기준 ·{" "}
                  {intl.basis.map((b) => BASIS_KO[b] ?? b).join(" / ")}
                </span>
              </div>
              {intl.series.length >= 2 && (
                <div className="stat">
                  <span className="statLabel">연도별 중앙값</span>
                  <Sparkline
                    values={intl.series.map((s) => s.med)}
                    width={150}
                    height={40}
                    label={`${intl.series[0].y}년부터의 해외 낙찰가 중앙값 추이`}
                  />
                  <span className="statNote">
                    {intl.series[0].y}–{intl.series[intl.series.length - 1].y} · {intl.currency} 기준
                  </span>
                </div>
              )}
              <div className="stat">
                <span className="statLabel">최근 24개월</span>
                <span className="statValue">
                  {intl.r24.sold}
                  <span className="statUnit">점 낙찰</span>
                </span>
                <span className="statNote">출품 {intl.r24.lots}점</span>
              </div>
            </div>

            <div className="tableWrap">
              <table className="lotTable">
                <caption className="srOnly">{name}의 해외 최근 출품 기록</caption>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>작품</th>
                    <th>추정가</th>
                    <th>낙찰가</th>
                  </tr>
                </thead>
                <tbody>
                  {intl.recent.map((l, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "nowrap", color: "var(--ink-35)" }}>{l.date}</td>
                      <td>
                        {l.url ? (
                          <a href={l.url} target="_blank" rel="noopener noreferrer">
                            {l.title ?? "무제"}
                          </a>
                        ) : (
                          (l.title ?? "무제")
                        )}
                        <span style={{ display: "block", fontSize: 11, color: "var(--ink-35)" }}>
                          {[l.house, l.sale].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                      <td className="num" style={{ color: "var(--ink-50)", whiteSpace: "nowrap" }}>
                        {fmtIntl(l.estLow, l.currency)}–{fmtIntl(l.estHigh, l.currency)}
                      </td>
                      <td className="num">
                        {l.sold ? fmtIntl(l.price, l.currency) : "유찰"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="statNote" style={{ marginTop: 12 }}>
              통화가 섞여 있어 금액은 합산하지 않고 각 경매의 원 통화로 표시합니다.
              본햄스·소더비는 해머가, 크리스티는 수수료 포함가라 두 값을 직접 비교할 수 없습니다.
            </p>
          </section>
        )}

        {galleryItems.length > 0 && (
          <section className="section">
            <div className="sectionHead">
              <h2 className="sectionTitle">갤러리 소식</h2>
              <span className="sectionNote">{gallery?.galleries.join(" · ")}</span>
            </div>
            <div className="galleryGrid">
              {galleryItems.map((i) => (
                <a
                  key={i.url}
                  className="galleryCard"
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="galleryCardTop">
                    <span className="galleryName">{i.gallery}</span>
                    <span className={`kindChip kindChip--${i.kind}`}>{KIND_LABEL[i.kind]}</span>
                    <span style={{ marginLeft: "auto" }}>{i.date}</span>
                  </span>
                  <span className="galleryTitle">{i.titleKo || i.title}</span>
                  {i.summary && <span className="gallerySummary">{i.summary}</span>}
                </a>
              ))}
            </div>
          </section>
        )}

        {mentions.length > 0 && (
          <section className="section">
            <div className="sectionHead">
              <h2 className="sectionTitle">언급</h2>
              <span className="sectionNote">최근 90일 · 뉴스와 영상</span>
            </div>
            <ul className="mentionList">
              {mentions.map((m, i) => (
                <li key={i}>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      {m.headline}
                    </a>
                  ) : (
                    <span>{m.headline}</span>
                  )}
                  <span className="mentionMeta">
                    {m.source} · {m.occurredOn}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!market && galleryItems.length === 0 && mentions.length === 0 && (
          <div className="emptyBox" style={{ marginTop: 26 }}>
            이 작가에 대해 수집된 자료가 아직 없습니다. 국내 경매 기록도, 추적 중인 갤러리
            17곳의 소식에도 최근 등장하지 않았습니다.
          </div>
        )}

        <Link href="/artists" className="backLink">
          ← 작가 목록으로
        </Link>

        <footer className="footer">
          작품 이미지는 저작권 확인 후에만 게재합니다. 인물 사진은 위키피디아의 CC 라이선스
          이미지입니다.
        </footer>
      </main>

      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
