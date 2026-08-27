import intlFile from "@/data/market/intl.json";
import { INDEX_ARTISTS } from "./market";

/**
 * 해외 경매 축. Bonhams · Christie's · Sotheby's(Artnet 내보내기)를 집계한 정적 인덱스.
 * `scripts/build_intl_market_index.py`가 만들고 커밋된다. 서버 전용.
 *
 * 국내 인덱스와 두 가지가 다르고, 그 차이가 화면 문구까지 결정한다.
 *
 * **통화가 섞인다.** GBP/USD/EUR/HKD/AUD/CHF/CNY가 한 데이터에 있고 믿을 만한 환산이
 * 없다(본햄스의 GBP 칼럼은 74%가 깨져 있다). 그래서 금액은 작가마다 가장 많이 쓰인
 * 통화로만 보고하고 절대 합산하지 않는다.
 *
 * **가격 정의가 다르다.** 본햄스·소더비는 해머가, 크리스티는 수수료 포함가다. 추정가는
 * 셋 다 해머 기준이라 크리스티 쪽 band가 구조적으로 높게 나온다(기준선 1.25 대 0.167).
 * `band`는 이미 자기 basis의 기준선을 뺀 값이라 서로 비교할 수 있다 — 0이 평균이다.
 */

export type IntlLot = {
  date: string;
  title: string | null;
  currency: string;
  estLow: number | null;
  estHigh: number | null;
  price: number | null;
  sold: boolean;
  basis: "hammer" | "premium";
  house: string;
  sale: string | null;
  url: string | null;
};

export type IntlArtist = {
  slug: string;
  en: string;
  lots: number;
  sold: number;
  houses: string[];
  basis: string[];
  currency: string | null;
  medianPrice: number | null;
  medianUsd: number | null;
  lastSale: string;
  band: number | null;
  r24: { lots: number; sold: number; band: number | null };
  series: { y: number; n: number; med: number }[];
  recent: IntlLot[];
};

const INTL = intlFile as unknown as {
  generatedFrom: string;
  coverage: [string, string];
  lotCount: number;
  artistCount: number;
  houses: string[];
  baselineBand: number;
  basisBaselines: Record<string, number>;
  artists: IntlArtist[];
  risers: Pick<IntlArtist, "slug" | "en" | "r24" | "medianPrice" | "currency" | "lots" | "houses">[];
  months: { m: string; lots: number; sold: number }[];
};

export const INTL_META = {
  generatedFrom: INTL.generatedFrom,
  coverage: INTL.coverage,
  lotCount: INTL.lotCount,
  artistCount: INTL.artistCount,
  houses: INTL.houses,
  basisBaselines: INTL.basisBaselines,
};

export const INTL_RISERS = INTL.risers;
export const INTL_MONTHS = INTL.months;

function norm(s: string): string {
  return s
    .normalize("NFKC")
    .trim()
    .replace(/\s*\((?:b\.|né|nee|born)?[^)]*\d{3,4}[^)]*\)\s*$/i, "")
    .toLowerCase()
    .replace(/[\s.·,\-']+/g, " ")
    .trim();
}

let byName: Map<string, IntlArtist> | null = null;
let bySlug: Map<string, IntlArtist> | null = null;

function maps() {
  if (!byName) {
    byName = new Map();
    bySlug = new Map();
    for (const a of INTL.artists) {
      bySlug.set(a.slug, a);
      const k = norm(a.en);
      if (!byName.has(k)) byName.set(k, a);
    }
  }
  return { byName: byName!, bySlug: bySlug! };
}

export function findIntlArtist(nameEn: string | null | undefined): IntlArtist | null {
  if (!nameEn) return null;
  return maps().byName.get(norm(nameEn)) ?? null;
}

export function intlArtistBySlug(slug: string): IntlArtist | null {
  return maps().bySlug.get(slug) ?? null;
}

/** 통화 기호를 붙여 짧게. 통화가 섞이므로 코드를 반드시 함께 보여준다. */
export function formatIntl(v: number | null | undefined, currency: string | null): string {
  if (v == null) return "—";
  const sym: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", HKD: "HK$", AUD: "A$", CHF: "CHF ", CNY: "¥" };
  const s = sym[currency ?? ""] ?? `${currency ?? ""} `;
  if (v >= 1_000_000) return `${s}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1000) return `${s}${Math.round(v / 1000)}K`;
  return `${s}${Math.round(v).toLocaleString("en-US")}`;
}

export const BASIS_LABEL: Record<string, string> = {
  hammer: "해머가",
  premium: "수수료 포함가",
};

// 한국 성씨. 국문 표기만으로 한국 작가와 음역된 해외 작가를 가르는 데 쓴다.
const KOREAN_SURNAMES =
  "김이박최정강조윤장임한오서신권황안송류유홍전고문양손배백허남심노하곽성차주우구나민진지엄채원천방공현함변염여추도소석선설마길위표명기반왕금옥육인맹제모탁국어은편용";

// 한국 성씨의 영문 표기. 한글만 보면 장샤오강(Zhang Xiaogang)이나 인베이더(Invader)
// 처럼 첫 글자가 한국 성씨와 겹치는 중국·프랑스 작가가 섞여 들어온다.
const ROMANIZED_SURNAMES = new Set([
  "lee", "yi", "rhee", "ri", "kim", "gim", "park", "pak", "bak", "choi", "choe",
  "jung", "chung", "jeong", "kang", "gang", "cho", "jo", "yoon", "yun", "jang",
  "chang", "lim", "im", "han", "oh", "suh", "seo", "shin", "sin", "kwon", "gwon",
  "hwang", "whang", "ahn", "an", "song", "ryu", "yoo", "yu", "hong", "jeon",
  "chun", "ko", "koh", "go", "moon", "mun", "yang", "son", "sohn", "bae", "baek",
  "paik", "heo", "hur", "huh", "nam", "sim", "shim", "noh", "roh", "ha", "kwak",
  "sung", "seong", "cha", "joo", "ju", "woo", "wu", "koo", "ku", "na", "min",
  "jin", "ji", "uhm", "eom", "chae", "won", "bang", "gong", "hyun", "ham",
  "byun", "byeon", "yeom", "yeo", "chu", "do", "so", "seok", "sun", "sul",
  "gil", "pyo", "myung", "ban", "keum", "ok", "yook", "maeng", "je", "tak",
  "kook", "eun", "pyeon",
]);

/**
 * "이우환"은 한국 작가, "파블로 피카소"는 음역된 해외 작가다. 국문 표기가 있다는
 * 사실만으로는 갈리지 않는다 — 경매 도록은 해외 작가도 전부 한글로 적기 때문이다.
 *
 * 한글 쪽: 띄어쓰기 없는 2~4음절이고 첫 글자가 성씨.
 * 영문 쪽: 첫 토큰이나 마지막 토큰이 한국 성씨의 로마자 표기.
 *          (도록에 따라 "Lee Ufan"으로도 "Seundja Rhee"로도 적힌다)
 * 둘 다 만족해야 한국 작가로 본다 — 한쪽만 보면 오탐이 난다.
 */
export function isKoreanName(ko: string, en?: string | null): boolean {
  const s = ko.trim();
  if (/\s/.test(s)) return false;
  if (!/^[가-힣]{2,4}$/.test(s)) return false;
  if (!KOREAN_SURNAMES.includes(s[0])) return false;

  if (!en) return true;
  const parts = en.toLowerCase().replace(/[^a-z\s-]/g, "").split(/[\s-]+/).filter(Boolean);
  if (parts.length < 2) return false;
  return ROMANIZED_SURNAMES.has(parts[0]) || ROMANIZED_SURNAMES.has(parts[parts.length - 1]);
}

export type AbroadRow = {
  slug: string;
  ko: string;
  en: string;
  domesticLots: number;
  intlLots: number;
  intlSold: number;
  houses: string[];
  currency: string | null;
  medianPrice: number | null;
  band: number | null;
  lastSale: string;
};

let crossCache: AbroadRow[] | null = null;

/**
 * 국내와 해외 경매 양쪽에 기록이 있는 작가.
 *
 * 이 교차 지점이 이 사이트에만 있는 화면이다 — 국내 매체는 국내 경매만 다루고 해외
 * 데이터베이스는 영문명만 쓰기 때문에, "한국 작가가 지금 해외에서 어떻게 팔리는가"는
 * 어느 쪽에도 없다. 두 인덱스를 잇는 열쇠는 서울옥션이 국문·영문 작가명을 나란히
 * 싣는다는 사실 하나뿐이다(`build_market_index.py`가 그걸로 사전을 만든다).
 */
function crossListed(minIntlLots = 3): AbroadRow[] {
  if (crossCache) return crossCache;

  const rows: AbroadRow[] = [];
  for (const dom of INDEX_ARTISTS) {
    // "작자미상"/"Anonymous"는 사람이 아니라 도록의 빈칸이다.
    if (!dom.ko || dom.ko === "작자미상" || /^anonymous$/i.test(dom.en)) continue;
    const intl = findIntlArtist(dom.en);
    if (!intl || intl.lots < minIntlLots) continue;
    rows.push({
      slug: dom.slug,
      ko: dom.ko,
      en: intl.en,
      domesticLots: dom.lots,
      intlLots: intl.lots,
      intlSold: intl.sold,
      houses: intl.houses,
      currency: intl.currency,
      medianPrice: intl.medianPrice,
      band: intl.r24.band ?? intl.band,
      lastSale: intl.lastSale,
    });
  }

  rows.sort((a, b) => b.intlSold - a.intlSold);
  crossCache = rows;
  return rows;
}

/** 한국 작가가 해외 경매에서 — 원래 기획의 "K-artist abroad". */
export function koreanArtistsAbroad(limit = 12): AbroadRow[] {
  return crossListed().filter((r) => isKoreanName(r.ko, r.en)).slice(0, limit);
}

/** 해외 작가가 국내 경매에서 — 그 반대쪽인 "Seoul now". */
export function foreignArtistsInSeoul(limit = 12): AbroadRow[] {
  return crossListed()
    .filter((r) => !isKoreanName(r.ko, r.en))
    .sort((a, b) => b.domesticLots - a.domesticLots)
    .slice(0, limit);
}
