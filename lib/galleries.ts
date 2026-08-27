import type { Scope } from "./data";

/**
 * 갤러리 뉴스 아카이브. 별도 크롤러 파이프라인이 매일 구글 시트에 쌓고,
 * 이 사이트는 그 시트를 인증 없이 CSV로 읽는다(링크 공개 설정).
 *
 * 시트가 곧 상태다 — 여기에 DB를 하나 더 두지 않는다. 탭을 추가하려면
 * GALLERIES에 한 줄 쓰면 된다.
 */

export type GallerySource = {
  tab: string;
  sheet: "west" | "kr";
  name: string;
  scope: Scope;
  city: string;
  site: string;
};

export const SHEETS = {
  west: "11t7VSThy17HJl17_eE7-1knTQV9G_cHPrBuAzODI8io",
  kr: "1R2aTnrqaN7XFr_4zq2KBlVcsFpqVyAOrfbb3CmptVtE",
} as const;

export const GALLERIES: GallerySource[] = [
  // 해외
  { tab: "gagosian", sheet: "west", name: "Gagosian", scope: "intl", city: "New York", site: "https://gagosian.com" },
  { tab: "hauser & wirth", sheet: "west", name: "Hauser & Wirth", scope: "intl", city: "Zürich", site: "https://www.hauserwirth.com" },
  { tab: "davidzwirner", sheet: "west", name: "David Zwirner", scope: "intl", city: "New York", site: "https://www.davidzwirner.com" },
  { tab: "Pace Gallery", sheet: "west", name: "Pace Gallery", scope: "intl", city: "New York", site: "https://www.pacegallery.com" },
  { tab: "White Cube", sheet: "west", name: "White Cube", scope: "intl", city: "London", site: "https://whitecube.com" },
  { tab: "Thaddaeus Ropac", sheet: "west", name: "Thaddaeus Ropac", scope: "intl", city: "Paris", site: "https://ropac.net" },
  { tab: "perrotin", sheet: "west", name: "Perrotin", scope: "intl", city: "Paris", site: "https://www.perrotin.com" },
  { tab: "almine rech", sheet: "west", name: "Almine Rech", scope: "intl", city: "Brussels", site: "https://www.alminerech.com" },
  { tab: "lisson gallery", sheet: "west", name: "Lisson Gallery", scope: "intl", city: "London", site: "https://www.lissongallery.com" },
  { tab: "galleria continua", sheet: "west", name: "Galleria Continua", scope: "intl", city: "San Gimignano", site: "https://www.galleriacontinua.com" },
  // 국내
  { tab: "kukje", sheet: "kr", name: "국제갤러리", scope: "kr", city: "서울", site: "https://www.kukjegallery.com" },
  { tab: "galleryhyundai", sheet: "kr", name: "갤러리현대", scope: "kr", city: "서울", site: "https://www.galleryhyundai.com" },
  { tab: "arario", sheet: "kr", name: "아라리오갤러리", scope: "kr", city: "서울", site: "https://www.arariogallery.com" },
  { tab: "pkm", sheet: "kr", name: "PKM갤러리", scope: "kr", city: "서울", site: "https://www.pkmgallery.com" },
  { tab: "hakgojae", sheet: "kr", name: "학고재", scope: "kr", city: "서울", site: "https://www.hakgojae.com" },
  { tab: "leeahn", sheet: "kr", name: "리안갤러리", scope: "kr", city: "대구", site: "https://www.leeahngallery.com" },
  { tab: "soheon", sheet: "kr", name: "소헌갤러리", scope: "kr", city: "대구", site: "https://www.soheongallery.com" },
];

/**
 * 갤러리마다 카테고리 표기가 제각각이라(‘solo show’ / ‘개인전’ / ‘Museum Exhibitions’ /
 * White Cube는 아예 지점 이름) 화면용으로 다섯 갈래로 정규화한다.
 */
export type Kind = "exhibition" | "fair" | "event" | "press" | "media";

export const KIND_LABEL: Record<Kind, string> = {
  exhibition: "전시",
  fair: "페어",
  event: "행사",
  press: "소식",
  media: "미디어",
};

const RULES: [RegExp, Kind][] = [
  [/art fair|아트페어|페어/i, "fair"],
  [/film|video|podcast|episode|season|re-release|pace live|영상|공연|screening|talk|performance/i, "media"],
  [/publish|publication|essay|learning|출판|기고/i, "media"],
  [/exhibition|solo show|group exhibition|biennale|개인전|단체전|그룹전|전시|상설전|회고전|비엔날레|프로젝트/i, "exhibition"],
  [/event|events|행사/i, "event"],
];

// White Cube는 카테고리 칸에 지점 이름(‘Mason’s Yard, London’)을 쓴다 — 전부 전시다.
const VENUE_AS_CATEGORY =
  /mason's yard|bermondsey|^paris$|^new york$|^seoul$|^hong kong$|^london$/i;

export function normalizeKind(category: string): Kind {
  const c = (category || "").trim();
  if (!c) return "press";
  if (VENUE_AS_CATEGORY.test(c)) return "exhibition";
  for (const [re, kind] of RULES) if (re.test(c)) return kind;
  return "press";
}

export function galleryByTab(tab: string): GallerySource | undefined {
  return GALLERIES.find((g) => g.tab === tab);
}
