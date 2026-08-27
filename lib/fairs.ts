import type { Scope } from "./data";

/**
 * 2026 아트페어·비엔날레 캘린더.
 *
 * Supabase `exhibitions`가 비어 있어도 캘린더는 항상 나와야 하므로 정적으로 동봉한다.
 * 날짜가 아직 발표되지 않은 행사는 지어내지 않고 `tba`로 둔다 — 없는 날짜를 쓰는 것보다
 * "미정"이라고 쓰는 편이 낫다.
 *
 * 출처: knowledge/09_international_art_fairs_2026.md (2026-08-24 조사).
 * TBA 항목은 발표되면 여기만 고치면 된다.
 */

export type FairKind = "fair" | "biennale" | "photo" | "design" | "book";

export type Fair = {
  id: string;
  name: string;
  nameKo?: string;
  city: string;
  country: string;
  scope: Scope;
  kind: FairKind;
  /** ISO 날짜. 미정이면 null이고 `tba`가 채워진다. */
  start: string | null;
  end: string | null;
  tba?: string;
  venue?: string;
  note?: string;
  url?: string;
  /** 국내 관람객이 실제로 갈 수 있는 급 — 홈 화면 노출 우선순위에 쓴다. */
  tier: 1 | 2 | 3;
};

export const FAIRS: Fair[] = [
  // ── 국내 ───────────────────────────────────────────
  { id: "art-ono-2026", name: "ART OnO", nameKo: "아트 오노", city: "서울", country: "KR", scope: "kr", kind: "fair", start: "2026-04-03", end: "2026-04-05", venue: "SETEC 강남", tier: 2, url: "https://art-ono.com", note: "2026년 출범. 20개국 이상 해외 갤러리 참가" },
  { id: "galleries-art-fair-2026", name: "Galleries Art Fair", nameKo: "화랑미술제", city: "서울", country: "KR", scope: "kr", kind: "fair", start: "2026-04-08", end: "2026-04-12", venue: "COEX C/D홀", tier: 1, url: "https://www.coexcenter.com/events/2026-galleries-art-fair/", note: "1979년 시작. 한국 최초의 아트페어" },
  { id: "galleries-art-fair-suwon-2026", name: "Galleries Art Fair Suwon", nameKo: "화랑미술제 수원", city: "수원", country: "KR", scope: "kr", kind: "fair", start: "2026-06-25", end: "2026-06-28", tier: 3, note: "화랑미술제의 지역 에디션" },
  { id: "art-busan-2026", name: "Art Busan", nameKo: "아트부산", city: "부산", country: "KR", scope: "kr", kind: "fair", start: "2026-05-21", end: "2026-05-24", venue: "BEXCO", tier: 1, url: "https://www.artbusan.com", note: "18개국 110여 갤러리. VIP 프리뷰 5월 21일" },
  { id: "hive-2026", name: "HIVE ART FAIR", nameKo: "하이브 아트페어", city: "서울", country: "KR", scope: "kr", kind: "fair", start: "2026-05-21", end: "2026-05-24", venue: "COEX 마곡", tier: 3, url: "https://hiveartfair.com", note: "2026년 첫 회. 부스비 없는 큐레이션 방식, 국내 36 + 해외 12곳" },
  { id: "kiaf-2026", name: "Kiaf SEOUL", nameKo: "키아프 서울", city: "서울", country: "KR", scope: "kr", kind: "fair", start: "2026-09-02", end: "2026-09-06", venue: "COEX", tier: 1, url: "https://kiaf.org", note: "25주년. 175개 갤러리. 신진 섹션 Kiaf Plus 병행" },
  { id: "frieze-seoul-2026", name: "Frieze Seoul", nameKo: "프리즈 서울", city: "서울", country: "KR", scope: "kr", kind: "fair", start: "2026-09-02", end: "2026-09-05", venue: "COEX", tier: 1, url: "https://www.frieze.com/fairs/frieze-seoul", note: "키아프와 같은 기간, 하루 먼저 끝난다" },
  { id: "diaf-2026", name: "Daegu International Art Fair", nameKo: "대구국제아트페어", city: "대구", country: "KR", scope: "kr", kind: "fair", start: null, end: null, tba: "2026년 일정 미발표", venue: "EXCO 대구", tier: 3 },

  // ── 해외: 아트바젤 ─────────────────────────────────
  { id: "abq-2026", name: "Art Basel Qatar", city: "도하", country: "QA", scope: "intl", kind: "fair", start: "2026-02-03", end: "2026-02-07", venue: "M7 Doha", tier: 2, url: "https://www.artbasel.com", note: "첫 회. 걸프 지역 확장의 신호" },
  { id: "abhk-2026", name: "Art Basel Hong Kong", city: "홍콩", country: "HK", scope: "intl", kind: "fair", start: "2026-03-25", end: "2026-03-29", venue: "홍콩 컨벤션센터", tier: 1, url: "https://www.artbasel.com/hong-kong", note: "41개국 240개 갤러리. VIP 25–26, 일반 27–29" },
  { id: "abb-2026", name: "Art Basel", city: "바젤", country: "CH", scope: "intl", kind: "fair", start: "2026-06-16", end: "2026-06-21", venue: "Messe Basel", tier: 1, url: "https://www.artbasel.com/basel", note: "1970년 시작한 본진" },
  { id: "abp-2026", name: "Art Basel Paris", city: "파리", country: "FR", scope: "intl", kind: "fair", start: "2026-10-23", end: "2026-10-25", venue: "그랑 팔레", tier: 1, url: "https://www.artbasel.com/paris", note: "2022년 FIAC 자리를 대체" },
  { id: "abmb-2026", name: "Art Basel Miami Beach", city: "마이애미", country: "US", scope: "intl", kind: "fair", start: "2026-12-04", end: "2026-12-06", tier: 1, url: "https://www.artbasel.com/miami-beach" },

  // ── 해외: 프리즈 ───────────────────────────────────
  { id: "frieze-la-2026", name: "Frieze Los Angeles", city: "로스앤젤레스", country: "US", scope: "intl", kind: "fair", start: "2026-02-26", end: "2026-03-01", tier: 2, url: "https://www.frieze.com/fairs" },
  { id: "frieze-ny-2026", name: "Frieze New York", city: "뉴욕", country: "US", scope: "intl", kind: "fair", start: "2026-05-13", end: "2026-05-17", tier: 1, url: "https://www.frieze.com/fairs" },
  { id: "frieze-london-2026", name: "Frieze London & Masters", city: "런던", country: "GB", scope: "intl", kind: "fair", start: "2026-10-14", end: "2026-10-18", venue: "리젠트 파크", tier: 1, url: "https://www.frieze.com/fairs" },

  // ── 해외: 기타 ─────────────────────────────────────
  { id: "zona-maco-2026", name: "Zona Maco", city: "멕시코시티", country: "MX", scope: "intl", kind: "fair", start: "2026-02-04", end: "2026-02-08", venue: "Centro Citibanamex", tier: 3, note: "라틴아메리카 최대 규모" },
  { id: "arco-2026", name: "ARCOmadrid", city: "마드리드", country: "ES", scope: "intl", kind: "fair", start: "2026-03-04", end: "2026-03-08", venue: "IFEMA", tier: 3 },
  { id: "art-dubai-2026", name: "Art Dubai", city: "두바이", country: "AE", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 4월 (정확한 날짜 미발표)", venue: "Madinat Jumeirah", tier: 3, note: "20주년 에디션. 35개국 100여 갤러리" },
  { id: "aipad-2026", name: "AIPAD The Photography Show", city: "뉴욕", country: "US", scope: "intl", kind: "photo", start: "2026-04-22", end: "2026-04-26", venue: "Park Avenue Armory", tier: 3 },
  { id: "la-artbook-2026", name: "LA Art Book Fair", city: "패서디나", country: "US", scope: "intl", kind: "book", start: "2026-05-07", end: "2026-05-10", venue: "ArtCenter", tier: 3 },
  { id: "tefaf-ny-2026", name: "TEFAF New York", city: "뉴욕", country: "US", scope: "intl", kind: "fair", start: "2026-05-14", end: "2026-05-19", venue: "Park Avenue Armory", tier: 2, note: "검증(vetting) 기준이 가장 엄격한 페어로 꼽힌다" },
  { id: "tefaf-maastricht-2026", name: "TEFAF Maastricht", city: "마스트리흐트", country: "NL", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 일정 미발표", tier: 2 },
  { id: "tokyo-gendai-2026", name: "Tokyo Gendai", city: "도쿄", country: "JP", scope: "intl", kind: "fair", start: "2026-09-11", end: "2026-09-13", tier: 2, note: "프리즈 서울 직후 — 서울에서 바로 넘어가는 갤러리가 많다" },
  { id: "armory-2026", name: "The Armory Show", city: "뉴욕", country: "US", scope: "intl", kind: "fair", start: "2026-09-24", end: "2026-09-27", tier: 2 },
  { id: "asia-now-2026", name: "Asia NOW", city: "파리", country: "FR", scope: "intl", kind: "fair", start: "2026-10-20", end: "2026-10-24", venue: "La Monnaie de Paris", tier: 3, note: "아시아·아시아 디아스포라 작가 중심 큐레이션 페어" },
  { id: "ack-2026", name: "Art Collaboration Kyoto", city: "교토", country: "JP", scope: "intl", kind: "fair", start: "2026-11-07", end: "2026-11-09", venue: "교토 국제회관", tier: 3, note: "부스마다 일본 갤러리와 해외 갤러리를 한 쌍으로 묶는 형식" },
  { id: "paris-photo-2026", name: "Paris Photo", city: "파리", country: "FR", scope: "intl", kind: "photo", start: "2026-11-12", end: "2026-11-15", tier: 2, note: "세계 최대 사진 페어" },
  { id: "west-bund-2026", name: "West Bund Art & Design", city: "상하이", country: "CN", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 11월 예상 (날짜 미발표)", tier: 3 },
  { id: "art021-2026", name: "ART021", city: "상하이", country: "CN", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 11월 (날짜 미발표)", tier: 3 },
  { id: "art-sg-2026", name: "Art SG", city: "싱가포르", country: "SG", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 일정 미발표", tier: 3 },
  { id: "taipei-dangdai-2026", name: "Taipei Dangdai", city: "타이베이", country: "TW", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 일정 미발표", tier: 3 },
  { id: "art-cologne-2026", name: "Art Cologne", city: "쾰른", country: "DE", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 일정 미발표", tier: 3, note: "1967년 창설, 세계에서 가장 오래된 아트페어" },
  { id: "expo-chicago-2026", name: "EXPO CHICAGO", city: "시카고", country: "US", scope: "intl", kind: "fair", start: null, end: null, tba: "2026년 일정 미확인", venue: "Navy Pier", tier: 3 },
  { id: "design-miami-2026", name: "Design Miami", city: "마이애미", country: "US", scope: "intl", kind: "design", start: null, end: null, tba: "아트바젤 마이애미비치와 같은 기간(12월)", tier: 3 },

  // ── 비엔날레 ───────────────────────────────────────
  { id: "venice-2026", name: "Venice Biennale", nameKo: "베네치아 비엔날레", city: "베네치아", country: "IT", scope: "intl", kind: "biennale", start: "2026-05-09", end: "2026-11-22", venue: "자르디니 · 아르세날레", tier: 1, url: "https://www.labiennale.org/en/art/2026", note: "《In Minor Keys》. 故 코요 쿠오 총감독 — 아프리카 여성 최초" },
];

export type FairStatus = "ongoing" | "upcoming" | "tba" | "past";

export function fairStatus(f: Fair, today: string): FairStatus {
  if (!f.start) return "tba";
  if (f.end && f.end < today) return "past";
  if (f.start <= today && (!f.end || f.end >= today)) return "ongoing";
  return "upcoming";
}

export function daysUntil(f: Fair, today: string): number | null {
  if (!f.start) return null;
  const a = Date.parse(today + "T00:00:00Z");
  const b = Date.parse(f.start + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

/** 진행 중 → 임박한 순 → 날짜 미정. 지난 행사는 뺀다. */
export function upcomingFairs(today: string, opts: { scope?: Scope; limit?: number } = {}): Fair[] {
  const rank: Record<FairStatus, number> = { ongoing: 0, upcoming: 1, tba: 2, past: 3 };
  const list = FAIRS.filter((f) => {
    if (opts.scope && f.scope !== opts.scope) return false;
    return fairStatus(f, today) !== "past";
  }).sort((a, b) => {
    const d = rank[fairStatus(a, today)] - rank[fairStatus(b, today)];
    if (d !== 0) return d;
    if (a.start && b.start) return a.start.localeCompare(b.start);
    return a.tier - b.tier;
  });
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export function formatFairDates(f: Fair): string {
  if (!f.start) return f.tba ?? "일정 미정";
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${Number(m)}월 ${Number(day)}일`;
  };
  if (!f.end || f.end === f.start) return fmt(f.start);
  const [, sm] = f.start.split("-");
  const [, em, ed] = f.end.split("-");
  return sm === em ? `${fmt(f.start)}–${Number(ed)}일` : `${fmt(f.start)} – ${Number(em)}월 ${Number(ed)}일`;
}
