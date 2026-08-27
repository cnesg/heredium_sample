"use client";

import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/gallerySheet";
import { KIND_LABEL, type Kind } from "@/lib/galleries";
import type { Scope } from "@/lib/data";

type State = { kind: "loading" } | { kind: "empty" } | { kind: "ready"; items: GalleryItem[] };

export default function GalleryNews({
  scope,
  filter,
  limit = 6,
  perGallery = 2,
}: {
  scope: Scope;
  /** 전시만 보여줄지 등. 없으면 전부 */
  filter?: Kind;
  limit?: number;
  perGallery?: number;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });

    const q = new URLSearchParams({ scope, limit: String(limit), perGallery: String(perGallery) });
    if (filter) q.set("kind", filter);

    fetch(`/api/gallery-news?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const items: GalleryItem[] = data.items ?? [];
        setState(items.length ? { kind: "ready", items } : { kind: "empty" });
      })
      .catch(() => alive && setState({ kind: "empty" }));

    return () => {
      alive = false;
    };
  }, [scope, filter, limit, perGallery]);

  if (state.kind === "loading") {
    return (
      <div className="galleryGrid" aria-busy="true">
        {Array.from({ length: Math.min(limit, 3) }, (_, i) => (
          <div key={i} className="galleryCard" aria-hidden="true">
            <span className="skeleton" style={{ width: "38%", height: 10 }} />
            <span className="skeleton" style={{ width: "92%" }} />
            <span className="skeleton" style={{ width: "78%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (state.kind === "empty") {
    return <p className="emptyNote">갤러리 소식을 불러오지 못했습니다.</p>;
  }

  return (
    <div className="galleryGrid">
      {state.items.map((i) => (
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
              {i.keywords.slice(0, 4).map((k) => (
                <span key={k} className="kw">
                  {k}
                </span>
              ))}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
