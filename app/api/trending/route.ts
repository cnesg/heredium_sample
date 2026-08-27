import { NextResponse } from "next/server";
import { computeTrending } from "@/lib/trending";
import { rankedGalleryArtists, findGalleryArtist } from "@/lib/galleryArtists";
import { findMarketArtist, marketScore } from "@/lib/market";
import { todayKST } from "@/lib/edition";
import type { Scope } from "@/lib/data";

export const dynamic = "force-dynamic";

export type TrendRow = {
  key: string;
  href: string;
  name: string;
  nameEn: string | null;
  reason: string;
  /** 경매 기록이 있으면 시장 점수. 없으면 null — 대부분의 신진 작가가 여기 해당한다. */
  marketScore: number | null;
};

/**
 * 트렌딩 작가 = "지금 활동이 잡히는" 순서다. 경매 급상승은 여기 섞지 않는다 —
 * 그건 홈의 시장 신호 섹션이 따로 담당하고, 두 목록이 같으면 화면이 같은 말을 두 번 한다.
 */
export async function GET(request: Request) {
  const scope = (new URL(request.url).searchParams.get("scope") === "intl" ? "intl" : "kr") as Scope;
  const limit = Math.min(40, Number(new URL(request.url).searchParams.get("limit")) || 10);
  const today = todayKST();

  const rows: TrendRow[] = [];
  const seen = new Set<string>();

  const mentions = await computeTrending(30).catch(() => []);
  for (const t of mentions) {
    const name = t.nameKo ?? t.nameEn;
    if (!name || seen.has(name)) continue;
    const gal = findGalleryArtist(t.nameKo, t.nameEn);
    const mkt = findMarketArtist(t.nameKo, t.nameEn);
    if ((gal ? gal.scope : mkt ? "kr" : "intl") !== scope) continue;
    seen.add(name);
    rows.push({
      key: name,
      href: `/artist/${encodeURIComponent(t.artistId)}`,
      name,
      nameEn: t.nameEn,
      reason: `이번 주 ${t.mentionsThisWeek}회 언급`,
      marketScore: mkt ? marketScore(mkt) : null,
    });
  }

  for (const a of rankedGalleryArtists(today, scope, 40)) {
    if (rows.length >= limit) break;
    // 이미 언급 쪽에서 잡힌 이름은 건너뛴다. 여기서 break하면 겹치는 이름 하나 때문에
    // 목록 전체가 잘린다.
    if (seen.has(a.ko)) continue;
    seen.add(a.ko);
    const mkt = findMarketArtist(a.ko, a.en);
    rows.push({
      key: a.ko,
      href: `/artist/${encodeURIComponent(a.ko)}`,
      name: a.ko,
      nameEn: a.en,
      reason:
        a.galleries.length > 1
          ? `${a.galleries[0]} 외 ${a.galleries.length - 1}곳 · ${a.n}건`
          : `${a.galleries[0]} · ${a.n}건`,
      marketScore: mkt ? marketScore(mkt) : null,
    });
  }

  return NextResponse.json(
    { trending: rows.slice(0, limit), scope },
    { headers: { "cache-control": "no-store" } }
  );
}
