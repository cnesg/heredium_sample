"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scope } from "@/lib/data";
import type { HeroItem } from "@/app/api/home/route";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import Hero from "@/components/Hero";
import Stories from "@/components/Stories";
import TrendingList from "@/components/TrendingList";
import MarketPulse from "@/components/MarketPulse";
import GalleryNews from "@/components/GalleryNews";
import FairsSection from "@/components/FairsSection";
import NewsList from "@/components/NewsList";
import VideoGrid from "@/components/VideoGrid";
import { editionLabel } from "@/lib/edition";

type Home = {
  lead: HeroItem | null;
  side: HeroItem[];
  keywords: { term: string; count: number }[];
  exhibitionCount: number;
};

export default function Page() {
  const [scope, setScope] = useState<Scope>("kr");
  const [edition, setEdition] = useState("");
  const [home, setHome] = useState<Home | null>(null);
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  useEffect(() => setEdition(editionLabel()), []);

  useEffect(() => {
    let alive = true;
    setHome(null);
    fetch(`/api/home?scope=${scope}`)
      .then((r) => r.json())
      .then((d) => alive && setHome(d))
      .catch(() => alive && setHome(null));
    return () => {
      alive = false;
    };
  }, [scope]);

  return (
    <>
      <TopBar scope={scope} onScope={setScope} onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        {edition && (
          <p className="edition">
            <span className="editionDot" aria-hidden="true" />
            {edition} · 매일 오전 7시에 새로 채워집니다
          </p>
        )}

        {/* ── 대 ─────────────────────────────────────── */}
        {home?.lead ? (
          <Hero lead={home.lead} side={home.side} />
        ) : (
          <div className="hero" aria-busy="true">
            <div className="heroLead">
              <span className="skeleton" style={{ width: "28%", height: 10 }} />
              <span className="skeleton" style={{ width: "88%", height: 30, marginTop: 12 }} />
              <span className="skeleton" style={{ width: "62%", height: 30 }} />
            </div>
            <div className="heroSide" />
          </div>
        )}

        <section className="section section--lead" aria-labelledby="who">
          <div className="sectionHead">
            <h2 className="sectionTitle" id="who">
              지금 움직이는 작가
            </h2>
            <span className="sectionNote">
              {scope === "kr" ? "갤러리 소식 · 경매 신호 · 언급량" : "해외 갤러리 소식 · 언급량"}
            </span>
            <Link className="sectionMore" href="/artists">
              전체 보기 →
            </Link>
          </div>
          <Stories scope={scope} />
        </section>

        {/* ── 중 ─────────────────────────────────────── */}
        <section className="section" aria-labelledby="trend">
          <div className="split">
            <div>
              <div className="sectionHead">
                <h2 className="sectionTitle" id="trend">
                  트렌딩
                </h2>
                <span className="sectionNote">최근 활동 기준</span>
              </div>
              <TrendingList scope={scope} limit={10} />
            </div>

            <div>
              <div className="sectionHead">
                <h2 className="sectionTitle">이번 주 키워드</h2>
                <span className="sectionNote">갤러리 아카이브 집계</span>
              </div>
              {home ? (
                home.keywords.length > 0 ? (
                  <div className="keywords">
                    {home.keywords.map((k) => (
                      <span key={k.term} className="keyword">
                        {k.term}
                        <span className="keywordCount">{k.count}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="emptyNote">집계할 키워드가 아직 없습니다.</p>
                )
              ) : (
                <div aria-busy="true">
                  <span className="skeleton" style={{ width: "84%" }} />
                  <span className="skeleton" style={{ width: "66%" }} />
                </div>
              )}
            </div>
          </div>
        </section>

        {scope === "kr" && (
          <section className="section" aria-labelledby="market">
            <div className="sectionHead">
              <h2 className="sectionTitle" id="market">
                시장 신호
              </h2>
              <span className="sectionNote">서울옥션 · 케이옥션 낙찰 결과 집계</span>
              <Link className="sectionMore" href="/market">
                시장 전체 →
              </Link>
            </div>
            <MarketPulse />
          </section>
        )}

        <section className="section" aria-labelledby="shows">
          <div className="sectionHead">
            <h2 className="sectionTitle" id="shows">
              전시
            </h2>
            <span className="sectionNote">
              {scope === "kr" ? "국내 갤러리 7곳" : "해외 갤러리 10곳"}
              {home ? ` · ${home.exhibitionCount}건 수집` : ""}
            </span>
            <Link className="sectionMore" href="/exhibitions">
              전체 보기 →
            </Link>
          </div>
          <GalleryNews scope={scope} filter="exhibition" limit={6} perGallery={1} />
        </section>

        <section className="section" aria-labelledby="cal">
          <div className="sectionHead">
            <h2 className="sectionTitle" id="cal">
              아트 캘린더
            </h2>
            <span className="sectionNote">페어 · 비엔날레</span>
            <Link className="sectionMore" href="/calendar">
              연간 일정 →
            </Link>
          </div>
          <FairsSection scope={scope} limit={10} />
        </section>

        <section className="section" aria-labelledby="galnews">
          <div className="sectionHead">
            <h2 className="sectionTitle" id="galnews">
              갤러리 소식
            </h2>
            <span className="sectionNote">전시 외 — 수상 · 보도 · 출판 · 영상</span>
          </div>
          <GalleryNews scope={scope} limit={6} perGallery={1} />
        </section>

        {/* ── 소 ─────────────────────────────────────── */}
        <section className="section section--minor" aria-labelledby="media">
          <h2 className="srOnly" id="media">
            영상과 뉴스
          </h2>
          <div className="split">
            <div>
              <div className="sectionHead">
                <h3 className="sectionTitle">영상</h3>
                <span className="sectionNote">YouTube</span>
              </div>
              <VideoGrid scope={scope} />
            </div>
            <div>
              <div className="sectionHead">
                <h3 className="sectionTitle">뉴스</h3>
                <span className="sectionNote">
                  {scope === "kr" ? "국내 매체 RSS" : "해외 매체 RSS · 번역"}
                </span>
              </div>
              <NewsList scope={scope} />
            </div>
          </div>
        </section>

        <footer className="footer">
          경매 데이터는 서울옥션·케이옥션의 공개 결과를 직접 집계한 것으로, 국내 시장만
          다룹니다. 가격은 과거 낙찰 기록이며 투자 판단의 근거가 아닙니다.
          <br />
          뉴스는 각 매체 RSS와 갤러리 공식 페이지에서 제목·요약·링크만 가져옵니다. 본문은
          원문에서 읽어 주세요. 작품 이미지는 저작권 확인 후에만 게재합니다.
          <br />
          <Link href="/sources">수집 소스 전체 보기</Link>
        </footer>
      </main>

      {askOn && !asking && (
        <button type="button" className="askFab" onClick={() => setAsking(true)}>
          <span aria-hidden="true">✦</span> 물어보기
        </button>
      )}
      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
