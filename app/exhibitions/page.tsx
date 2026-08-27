"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Ask from "@/components/Ask";
import { useAskEnabled } from "@/components/useAsk";
import { KIND_LABEL, type Kind } from "@/lib/galleries";
import type { GalleryItem } from "@/lib/gallerySheet";
import type { Scope } from "@/lib/data";

type GalleryMeta = { tab: string; name: string; city: string; scope: Scope; count: number };

const KINDS: (Kind | "all")[] = ["all", "exhibition", "fair", "event", "press", "media"];

export default function ExhibitionsPage() {
  const [scope, setScope] = useState<Scope>("kr");
  const [kind, setKind] = useState<Kind | "all">("exhibition");
  const [gallery, setGallery] = useState<string>("all");
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [galleries, setGalleries] = useState<GalleryMeta[]>([]);
  const [asking, setAsking] = useState(false);
  const askOn = useAskEnabled();

  useEffect(() => {
    let alive = true;
    setItems(null);

    const q = new URLSearchParams({ scope, limit: "120", perGallery: "99" });
    if (kind !== "all") q.set("kind", kind);
    if (gallery !== "all") q.set("gallery", gallery);

    fetch(`/api/gallery-news?${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(d.items ?? []);
        if (gallery === "all") setGalleries(d.galleries ?? []);
      })
      .catch(() => alive && setItems([]));

    return () => {
      alive = false;
    };
  }, [scope, kind, gallery]);

  // 스코프를 바꾸면 이전 스코프의 갤러리 필터가 남아 결과가 0건이 된다.
  useEffect(() => setGallery("all"), [scope]);

  return (
    <>
      <TopBar scope={scope} onScope={setScope} onAsk={askOn ? () => setAsking(true) : undefined} />

      <main className="shell">
        <h1 className="pageTitle">전시</h1>
        <p className="pageIntro">
          국내 7곳, 해외 10곳 갤러리의 공식 소식을 매일 수집해 한국어 제목·요약·키워드를
          붙여 쌓은 아카이브입니다. 원문은 각 갤러리 페이지에서 볼 수 있습니다.
        </p>

        <section className="section" style={{ paddingTop: 26 }}>
          <div className="chipRow">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="chip"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
              >
                {k === "all" ? "전체" : KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="chipRow">
            <button
              type="button"
              className="chip"
              aria-pressed={gallery === "all"}
              onClick={() => setGallery("all")}
            >
              모든 갤러리
            </button>
            {galleries
              .filter((g) => g.count > 0)
              .map((g) => (
                <button
                  key={g.tab}
                  type="button"
                  className="chip"
                  aria-pressed={gallery === g.tab}
                  onClick={() => setGallery(g.tab)}
                >
                  {g.name} <span className="num">{g.count}</span>
                </button>
              ))}
          </div>

          {items === null ? (
            <div className="galleryGrid" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="galleryCard" aria-hidden="true">
                  <span className="skeleton" style={{ width: "40%", height: 10 }} />
                  <span className="skeleton" style={{ width: "92%" }} />
                  <span className="skeleton" style={{ width: "74%" }} />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="emptyNote">이 조건에 맞는 항목이 없습니다.</p>
          ) : (
            <>
              <p className="sectionNote" style={{ display: "block", marginBottom: 14 }}>
                {items.length}건
              </p>
              <div className="galleryGrid">
                {items.map((i) => (
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
                    {i.keywords.length > 0 && (
                      <span className="kwRow">
                        {i.keywords.slice(0, 5).map((k) => (
                          <span key={k} className="kw">
                            {k}
                          </span>
                        ))}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="footer">
          제목·요약·링크만 가져오며 본문은 재게시하지 않습니다. 원문은 각 갤러리 사이트에서
          읽어 주세요.
          <br />
          <Link href="/sources">수집 소스 전체 보기</Link>
        </footer>
      </main>

      {askOn && asking && <Ask onClose={() => setAsking(false)} />}
    </>
  );
}
