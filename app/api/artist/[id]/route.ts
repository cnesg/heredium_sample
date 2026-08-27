import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { findMarketArtist, marketArtistBySlug, marketScore, MARKET_META, type MarketArtist } from "@/lib/market";
import { findGalleryArtist } from "@/lib/galleryArtists";
import { collectGalleryNews, type GalleryItem } from "@/lib/gallerySheet";
import { findArtistPhoto } from "@/lib/wiki";
import { findIntlArtist } from "@/lib/intlMarket";
import { explainArtist } from "@/lib/why";
import { todayKST } from "@/lib/edition";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 작가 한 명을 세 소스에서 모아 보여준다. 식별자는 셋 다 받는다:
 *   UUID       Supabase artists.id  (언급 파이프라인이 만든 작가)
 *   경매 slug   lib/market.ts의 인덱스
 *   이름        위 둘 어디에도 없거나, 갤러리 아카이브에서 온 작가
 *
 * 대부분의 작가는 Supabase에 아직 없다 — 크론이 며칠 돌아야 쌓이기 때문이다.
 * 그래서 UUID만 받던 원래 구조로는 화면 대부분이 404였다.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  const db = supabaseAnon();

  let dbArtist: { id: string; name_ko: string | null; name_en: string | null; nationality: string | null; tier: string | null } | null = null;
  let market: MarketArtist | null = null;

  if (UUID.test(id) && db) {
    const { data } = await db
      .from("artists")
      .select("id,name_ko,name_en,nationality,tier")
      .eq("id", id)
      .maybeSingle();
    dbArtist = data ?? null;
  } else {
    market = marketArtistBySlug(id);
  }

  const nameKo = dbArtist?.name_ko ?? market?.ko ?? (UUID.test(id) ? null : id);
  const nameEn = dbArtist?.name_en ?? market?.en ?? null;

  if (!nameKo && !nameEn) {
    return NextResponse.json({ error: "작가를 찾을 수 없습니다" }, { status: 404 });
  }

  if (!market) market = findMarketArtist(nameKo, nameEn);
  const gallery = findGalleryArtist(nameKo, nameEn);

  // Supabase를 이름으로 한 번 더 찾아본다 — slug/이름으로 들어왔어도 언급 기록이
  // 있으면 보여줘야 한다.
  if (!dbArtist && db && nameKo) {
    const { data } = await db
      .from("artists")
      .select("id,name_ko,name_en,nationality,tier")
      .eq("name_ko", nameKo)
      .maybeSingle();
    dbArtist = data ?? null;
  }

  let mentions: { headline: string; url: string | null; source: string; occurredOn: string; axis: string }[] = [];
  if (dbArtist && db) {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data: signals } = await db
      .from("signals")
      .select("headline,url,source,occurred_on,axis")
      .eq("artist_id", dbArtist.id)
      .gte("occurred_on", since.toISOString().slice(0, 10))
      .order("occurred_on", { ascending: false })
      .limit(30);

    mentions = (signals ?? [])
      .filter((s) => s.headline)
      .map((s) => ({
        headline: s.headline as string,
        url: s.url as string | null,
        source: s.source as string,
        occurredOn: s.occurred_on as string,
        axis: s.axis as string,
      }));
  }

  // 갤러리 아카이브에서 이 작가가 주인공인 항목. 요약이 있어 언급보다 밀도가 높다.
  let galleryItems: GalleryItem[] = [];
  if (gallery) {
    const all = await collectGalleryNews({ scope: gallery.scope }).catch(() => []);
    const names = new Set(gallery.aliases);
    galleryItems = all.filter((i) => i.keywords[0] && names.has(i.keywords[0])).slice(0, 10);
  }

  const intl = findIntlArtist(nameEn ?? market?.en ?? nameKo);
  const photo = await findArtistPhoto(nameKo, nameEn);

  // 왜 이 작가가 지금 화면에 있는지를 우리가 센 수에서 직접 조립한다.
  // 모델을 부르지 않으므로 과금이 없고, 순위 계산과 같은 숫자를 쓴다.
  const why = explainArtist({
    today: todayKST(),
    gallery,
    market,
    intl,
    mentions: mentions.length,
    domesticBaseline: MARKET_META.baselineBand,
  });

  return NextResponse.json(
    {
      artist: {
        id: dbArtist?.id ?? market?.slug ?? nameKo,
        nameKo,
        nameEn,
        nationality: dbArtist?.nationality ?? null,
        tier: dbArtist?.tier ?? null,
        photo,
      },
      why,
      market: market ? { ...market, score: marketScore(market) } : null,
      intl,
      gallery: gallery ?? null,
      galleryItems,
      mentions,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
