"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Scope } from "@/lib/data";

type Story = {
  key: string;
  href: string;
  nameKo: string;
  nameEn: string | null;
  photo: string | null;
  reason: string;
};

type State = { kind: "loading" } | { kind: "empty" } | { kind: "ready"; stories: Story[] };

export default function Stories({ scope }: { scope: Scope }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });

    fetch(`/api/stories?scope=${scope}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const stories: Story[] = data.stories ?? [];
        setState(stories.length ? { kind: "ready", stories } : { kind: "empty" });
      })
      .catch(() => alive && setState({ kind: "empty" }));

    return () => {
      alive = false;
    };
  }, [scope]);

  if (state.kind === "loading") {
    return (
      <div className="storiesRow" aria-busy="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="storyItem" aria-hidden="true">
            <span className="storyRing skeletonBlock" style={{ boxShadow: "none" }} />
          </div>
        ))}
      </div>
    );
  }

  if (state.kind === "empty") return null;

  return (
    <div className="storiesRow" aria-label="지금 움직이는 작가">
      {state.stories.map((s) => (
        <Link key={s.key} href={s.href} className="storyItem" title={`${s.nameKo} · ${s.reason}`}>
          <span className="storyRing">
            {s.photo ? (
              <img src={s.photo} alt="" className="storyPhoto" loading="lazy" />
            ) : (
              <span className="storyInitial">{s.nameKo.slice(0, 1)}</span>
            )}
          </span>
          <span className="storyName">{s.nameKo}</span>
          <span className="storyWhy">{s.reason}</span>
        </Link>
      ))}
    </div>
  );
}
