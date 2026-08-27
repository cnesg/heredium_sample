import { NextResponse } from "next/server";
import { computeTrending } from "@/lib/trending";
import { findArtistPhotos } from "@/lib/wiki";
import { rankedGalleryArtists, findGalleryArtist } from "@/lib/galleryArtists";
import { RECENT, findMarketArtist } from "@/lib/market";
import { todayKST } from "@/lib/edition";
import type { Scope } from "@/lib/data";

export const dynamic = "force-dynamic";

export type Story = {
  key: string;
  href: string;
  nameKo: string;
  nameEn: string | null;
  photo: string | null;
  reason: string;
};

/**
 * 상단 스토리 원형. 국내·해외 양쪽 모두 채워져야 하므로 세 소스를 합친다.
 *
 *   갤러리 뉴스 아카이브 → 두 스코프 모두. Supabase가 비어도 항상 있다.
 *   경매 급상승          → 국내(서울·케이옥션 데이터라 국내 작가 위주)
 *   Supabase 언급 트렌딩  → 크론이 쌓인 만큼. 있으면 앞에 온다.
 *
 * 언급 signals에는 아직 scope 칼럼이 없어서, 트렌딩 작가의 국내/해외는 갤러리 명단과
 * 경매 인덱스에 이름이 있는지로 판단한다.
 */
export async function GET(request: Request) {
  const scope = (new URL(request.url).searchParams.get("scope") === "intl" ? "intl" : "kr") as Scope;
  const today = todayKST();

  // 소스별로 따로 모은 뒤 번갈아 뽑는다. 한 소스를 다 채우고 넘어가면 국내 스코프가
  // 경매 급상승 12명으로만 채워져, 원 12개가 전부 같은 배지를 달게 된다.
  const fromMentions: Story[] = [];
  const fromMarket: Story[] = [];
  const fromGallery: Story[] = [];

  const trending = await computeTrending(20).catch(() => []);
  for (const t of trending) {
    const name = t.nameKo ?? t.nameEn;
    if (!name) continue;
    const gal = findGalleryArtist(t.nameKo, t.nameEn);
    const mkt = findMarketArtist(t.nameKo, t.nameEn);
    // 경매 기록이 있으면 국내, 갤러리 명단에 있으면 그쪽 스코프를 따른다.
    const theirScope: Scope = gal ? gal.scope : mkt ? "kr" : "intl";
    if (theirScope !== scope) continue;
    fromMentions.push({
      key: name,
      href: `/artist/${encodeURIComponent(t.artistId)}`,
      nameKo: name,
      nameEn: t.nameEn,
      photo: null,
      reason: `${t.mentionsThisWeek}회 언급`,
    });
  }

  if (scope === "kr") {
    for (const r of RECENT.risers) {
      const name = r.ko ?? r.en;
      if (!name) continue;
      fromMarket.push({
        key: name,
        href: `/artist/${encodeURIComponent(r.slug)}`,
        nameKo: name,
        nameEn: r.en,
        photo: null,
        reason: "경매 상승",
      });
    }
  }

  for (const a of rankedGalleryArtists(today, scope, 16)) {
    fromGallery.push({
      key: a.ko,
      href: `/artist/${encodeURIComponent(a.ko)}`,
      nameKo: a.ko,
      nameEn: a.en,
      photo: null,
      reason: a.galleries[0],
    });
  }

  const picked = new Map<string, Story>();
  const queues = [fromMentions, fromGallery, fromMarket];
  for (let i = 0; picked.size < 12 && queues.some((q) => i < q.length); i++) {
    for (const q of queues) {
      if (i < q.length && !picked.has(q[i].key)) picked.set(q[i].key, q[i]);
    }
  }

  const stories = [...picked.values()].slice(0, 12);
  const photos = await findArtistPhotos(stories).catch(() => new Map<string, string>());

  return NextResponse.json(
    {
      stories: stories.map((s) => ({ ...s, photo: photos.get(s.nameKo) ?? null })),
      scope,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
