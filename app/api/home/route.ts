import { NextResponse } from "next/server";
import { collectGalleryNews, diversifyByGallery, trendingKeywords } from "@/lib/gallerySheet";
import { RECENT, formatKRW, bandLabel } from "@/lib/market";
import { upcomingFairs, fairStatus, formatFairDates, daysUntil } from "@/lib/fairs";
import { todayKST } from "@/lib/edition";
import type { Scope } from "@/lib/data";

export const dynamic = "force-dynamic";

export type HeroItem = {
  kicker: string;
  title: string;
  body?: string;
  meta: string;
  href?: string;
  external?: boolean;
};

/**
 * 홈 상단 대(大) 영역. 오늘 가장 먼저 봐야 할 것 하나와 그 옆에 셋.
 *
 * 우선순위: ①진행 중이거나 임박한 대형 페어 → ②경매에서 눈에 띈 결과 →
 * ③갤러리 아카이브의 최신 전시. 페어를 맨 앞에 둔 이유는 유일하게 "지금 가야 하는 것"
 * 이기 때문이다 — 나머지는 내일 봐도 늦지 않다.
 */
export async function GET(request: Request) {
  const scope = (new URL(request.url).searchParams.get("scope") === "intl" ? "intl" : "kr") as Scope;
  const today = todayKST();

  const all = await collectGalleryNews({ scope }).catch(() => []);
  const exhibitions = all.filter((i) => i.kind === "exhibition");

  const candidates: HeroItem[] = [];

  const fair = upcomingFairs(today, { scope }).find(
    (f) => f.tier === 1 && f.start !== null && (daysUntil(f, today) ?? 999) <= 21
  );
  if (fair) {
    const d = daysUntil(fair, today) ?? 0;
    const ongoing = fairStatus(fair, today) === "ongoing";
    candidates.push({
      kicker: ongoing ? "지금 열리는 중" : `${d}일 뒤`,
      title: fair.nameKo ? `${fair.nameKo} — ${fair.name}` : fair.name,
      body: fair.note ?? undefined,
      meta: `${fair.city}${fair.venue ? ` · ${fair.venue}` : ""} · ${formatFairDates(fair)}`,
      href: fair.url ?? "/calendar",
      external: Boolean(fair.url),
    });
  }

  if (scope === "kr") {
    const riser = RECENT.risers[0];
    if (riser && riser.r24.band !== null) {
      candidates.push({
        kicker: "경매 신호",
        title: `${riser.ko ?? riser.en}, 최근 낙찰 ${riser.r24.sold}점이 ${bandLabel(riser.r24.band)}`,
        body:
          `국내 경매의 낙찰가 중앙값은 추정가 하한에 정확히 걸린다. ` +
          `그 기준을 꾸준히 넘긴다는 건 시장이 이 이름을 다시 보고 있다는 뜻이다. ` +
          `낙찰가 중앙값 ${formatKRW(riser.medianHammer)}, 누적 출품 ${riser.lots}점.`,
        meta: `서울옥션·케이옥션 · 최근 24개월`,
        href: `/artist/${encodeURIComponent(riser.slug)}`,
      });
    }

    const hit = RECENT.notable[0];
    if (hit) {
      candidates.push({
        kicker: "이번 낙찰",
        title: `${hit.artistKo ?? hit.artist} 〈${hit.title ?? "무제"}〉 ${formatKRW(hit.hammer)}`,
        meta: `추정가 ${formatKRW(hit.estLow)}–${formatKRW(hit.estHigh)} · ${hit.house} · ${hit.date}`,
        href: `/artist/${encodeURIComponent(hit.slug)}`,
      });
    }
  }

  for (const e of diversifyByGallery(exhibitions, 4, 1)) {
    candidates.push({
      kicker: e.gallery,
      title: e.titleKo || e.title,
      body: e.summary.split("\n")[0],
      meta: `${e.city} · ${e.date}`,
      href: e.url,
      external: true,
    });
  }

  return NextResponse.json(
    {
      lead: candidates[0] ?? null,
      side: candidates.slice(1, 4),
      keywords: trendingKeywords(all, 12),
      exhibitionCount: exhibitions.length,
      today,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
