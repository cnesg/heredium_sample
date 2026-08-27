import artistsFile from "@/data/market/artists.json";
import recentFile from "@/data/market/recent.json";

/**
 * 시장 축. 서울옥션·케이옥션 공개 경매 결과를 집계한 정적 인덱스를 읽는다.
 * `scripts/build_market_index.py`가 만들고 커밋된다 — Vercel 크론은 로컬 CSV를
 * 볼 수 없으므로, 매일 바뀌지 않는 이 데이터는 리포지토리에 동봉하는 편이 맞다.
 *
 * 서버 전용. 2MB짜리 인덱스라 클라이언트 컴포넌트에서 import하면 안 된다.
 */

export type MarketLot = {
  date: string;
  title: string | null;
  year: string | null;
  medium: string | null;
  estLow: number | null;
  estHigh: number | null;
  hammer: number | null;
  sold: boolean;
  house: string;
  sale: string | null;
};

export type MarketArtist = {
  slug: string;
  en: string;
  ko: string | null;
  aliases: string[];
  lots: number;
  sold: number;
  medianHammer: number | null;
  totalHammer: number;
  lastSale: string;
  band: number | null;
  r24: { lots: number; sold: number; band: number | null };
  series: { y: number; n: number; med: number }[];
  recent: MarketLot[];
};

const INDEX = artistsFile as unknown as {
  generatedFrom: string;
  coverage: [string, string];
  lotCount: number;
  artistCount: number;
  houses: string[];
  baselineBand: number;
  artists: MarketArtist[];
};

export const RECENT = recentFile as unknown as {
  generatedFrom: string;
  coverage: [string, string];
  lotCount: number;
  baselineBand: number;
  houses: string[];
  notable: {
    artist: string;
    artistKo: string | null;
    slug: string;
    date: string;
    title: string | null;
    hammer: number;
    estLow: number;
    estHigh: number;
    band: number;
    house: string;
    sale: string | null;
  }[];
  risers: {
    slug: string;
    en: string;
    ko: string | null;
    lots: number;
    medianHammer: number | null;
    r24: { lots: number; sold: number; band: number | null };
  }[];
  months: { m: string; lots: number; sold: number; hammer: number }[];
};

/** 해외 인덱스와 이름을 맞출 때 필요해 그대로 내보낸다. */
export const INDEX_ARTISTS: MarketArtist[] = INDEX.artists;

export const MARKET_META = {
  generatedFrom: INDEX.generatedFrom,
  coverage: INDEX.coverage,
  lotCount: INDEX.lotCount,
  artistCount: INDEX.artistCount,
  houses: INDEX.houses,
  baselineBand: INDEX.baselineBand,
};

function norm(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase().replace(/[\s.·,]+/g, " ");
}

let byAlias: Map<string, MarketArtist> | null = null;
let bySlug: Map<string, MarketArtist> | null = null;

function maps() {
  if (!byAlias) {
    byAlias = new Map();
    bySlug = new Map();
    for (const a of INDEX.artists) {
      bySlug.set(a.slug, a);
      for (const alias of a.aliases) {
        // 첫 등록이 이긴다 — artists는 낙찰총액 내림차순이라 동명이인이 있으면
        // 거래가 더 두터운 쪽이 잡힌다.
        if (!byAlias.has(alias)) byAlias.set(alias, a);
      }
    }
  }
  return { byAlias: byAlias!, bySlug: bySlug! };
}

/** 언급 파이프라인이 뽑은 한국어/영문 이름으로 경매 기록을 찾는다. */
export function findMarketArtist(
  nameKo: string | null | undefined,
  nameEn?: string | null
): MarketArtist | null {
  const { byAlias } = maps();
  for (const n of [nameKo, nameEn]) {
    if (!n) continue;
    const hit = byAlias.get(norm(n));
    if (hit) return hit;
  }
  return null;
}

export function marketArtistBySlug(slug: string): MarketArtist | null {
  return maps().bySlug.get(slug) ?? null;
}

/**
 * 0~100 시장 점수. "얼마나 비싼가"가 아니라 "지금 얼마나 움직이는가"를 잰다 —
 * 총액으로 매기면 이우환·김환기가 영구히 상단을 차지하고 화면이 죽는다.
 *
 * band는 낙찰가가 그 롯의 추정가 구간 어디에 떨어졌는지다(0=하한, 1=상한).
 * 국내 시장 전체 중앙값이 정확히 0.0이라, 0을 넘는다는 것 자체가 평균 이상이라는 뜻.
 */
export function marketScore(a: MarketArtist | null): number {
  if (!a || a.r24.sold === 0) return 0;

  const activity = Math.min(1, Math.log1p(a.r24.sold) / Math.log1p(25));
  const band = a.r24.band ?? a.band ?? 0;
  const strength = Math.max(0, Math.min(1, (band - INDEX.baselineBand + 0.3) / 1.1));
  const sellThrough = a.r24.sold / Math.max(1, a.r24.lots);

  return Math.round(100 * (0.4 * activity + 0.4 * strength + 0.2 * sellThrough));
}

/** 원 단위를 한국식 축약으로. 1,200,000 → "120만", 320,000,000 → "3.2억" */
export function formatKRW(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1e8) {
    const eok = v / 1e8;
    return `${eok >= 10 ? Math.round(eok) : eok.toFixed(1).replace(/\.0$/, "")}억`;
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString("ko-KR")}만`;
  return v.toLocaleString("ko-KR");
}

/** band 값을 사람이 읽는 문장으로. 색이 아니라 말로 표현한다. */
export function bandLabel(band: number | null | undefined): string | null {
  if (band == null) return null;
  if (band >= 1) return "추정가 상단 돌파";
  if (band >= 0.5) return "추정가 상단권";
  if (band > 0.05) return "추정가 중간권";
  if (band >= -0.05) return "추정가 하한";
  return "추정가 하한 아래";
}
