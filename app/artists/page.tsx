"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import Stories from "@/components/Stories";
import TrendingList from "@/components/TrendingList";
import type { Scope } from "@/lib/data";

export default function ArtistsPage() {
  const [scope, setScope] = useState<Scope>("kr");
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  return (
    <>
      <TopBar scope={scope} onScope={setScope} onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        <h1 className="pageTitle">작가</h1>
        <p className="pageIntro">
          갤러리 17곳의 소식과 국내 경매 낙찰 기록에서 지금 활동이 잡히는 이름을 모았습니다.
          순위는 최근 활동량 기준이며, 작품 가치나 작가의 중요도를 평가한 것이 아닙니다.
        </p>

        <Stories scope={scope} />

        <section className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">
              {scope === "kr" ? "국내" : "해외"} 트렌딩
            </h2>
            <span className="sectionNote">갤러리 소식 · 언급량 기준 · 경매 점수는 최근 24개월 활동</span>
          </div>
          <TrendingList scope={scope} limit={30} />
        </section>

        <footer className="footer">
          이 목록은 수집된 소식의 양을 셈한 결과입니다. 소식이 적다는 것이 작업의 가치와
          무관하다는 점을 염두에 두고 봐 주세요.
          <br />
          <Link href="/sources">수집 소스 전체 보기</Link>
        </footer>
      </main>

      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
