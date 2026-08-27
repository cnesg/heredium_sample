import { NextResponse } from "next/server";
import { RECENT, MARKET_META, marketArtistBySlug, marketScore, findMarketArtist } from "@/lib/market";
import {
  INTL_META,
  INTL_RISERS,
  INTL_MONTHS,
  koreanArtistsAbroad,
  foreignArtistsInSeoul,
} from "@/lib/intlMarket";

export const revalidate = 86400;

/**
 * 시장 축 데이터. 정적 인덱스를 읽을 뿐이라 외부 호출이 없다.
 *   ?artist=<slug|이름>  한 작가의 국내 경매 이력
 *   ?scope=intl          해외 경매 집계
 *   (없으면)             국내 집계
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const q = p.get("artist");

  if (q) {
    const a = marketArtistBySlug(q) ?? findMarketArtist(q, q);
    if (!a) return NextResponse.json({ artist: null }, { status: 200 });
    return NextResponse.json({ artist: a, score: marketScore(a), meta: MARKET_META });
  }

  if (p.get("scope") === "intl") {
    return NextResponse.json({
      meta: INTL_META,
      risers: INTL_RISERS,
      months: INTL_MONTHS,
      // 두 인덱스가 만나는 지점. 어느 한쪽 데이터만으로는 만들 수 없는 화면이다.
      abroad: koreanArtistsAbroad(12),
      seoulNow: foreignArtistsInSeoul(12),
    });
  }

  return NextResponse.json({
    meta: MARKET_META,
    risers: RECENT.risers,
    notable: RECENT.notable,
    months: RECENT.months,
  });
}
