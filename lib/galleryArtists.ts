import galleryArtistsFile from "@/data/gallery/artists.json";
import type { Scope } from "./data";

/**
 * 갤러리 뉴스 아카이브에서 뽑은 작가 명단.
 *
 * 시트의 `키워드(한글)` 첫 항목은 거의 언제나 그 기사의 주인공 작가다. 다만 갤러리명·
 * 큐레이터·전시 제목이 섞여 들어와서, 후보를 뽑은 뒤 사람이 아닌 항목을 한 번 걸러
 * 이 파일로 고정했다. 갤러리 탭이 늘면 `scripts/`의 후보 추출을 다시 돌려 갱신한다.
 *
 * Supabase가 비어 있어도 화면이 살아있게 하는 게 목적이다 — 언급 signals는 크론이
 * 며칠 돌아야 쌓이지만, 이 명단은 이미 수집된 1,000여 건의 결과라 즉시 쓸 수 있다.
 */

export type GalleryArtist = {
  ko: string;
  en: string | null;
  /** 이 작가가 주인공인 갤러리 뉴스 건수 */
  n: number;
  scope: Scope;
  galleries: string[];
  /** 가장 최근 언급 날짜 */
  last: string;
  /** 병합된 한글 표기들(아니시/아니쉬 카푸어) — 조회에 전부 쓴다 */
  aliases: string[];
};

const FILE = galleryArtistsFile as unknown as { artists: GalleryArtist[] };

function norm(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase().replace(/[\s.·,-]+/g, " ");
}

/**
 * 같은 작가가 한글 표기 차이로 두 번 들어오는 경우가 있다(아니시/아니쉬 카푸어,
 * 코헤이 나와/나와 고헤이). 영문명이 같으면 한 사람으로 합치고, 건수가 많은 쪽의
 * 한글 표기를 대표로 쓴다.
 */
function merge(rows: GalleryArtist[]): GalleryArtist[] {
  const byEn = new Map<string, GalleryArtist>();
  const out: GalleryArtist[] = [];

  for (const a of rows) {
    if (!a.en) {
      out.push({ ...a, aliases: [a.ko] });
      continue;
    }
    const key = norm(a.en);
    const prev = byEn.get(key);
    if (!prev) {
      byEn.set(key, { ...a, galleries: [...a.galleries], aliases: [a.ko] });
      continue;
    }
    if (a.n > prev.n) prev.ko = a.ko; // 건수가 많은 표기를 대표로
    prev.aliases.push(a.ko);
    prev.n += a.n;
    prev.galleries = [...new Set([...prev.galleries, ...a.galleries])];
    if (a.last > prev.last) prev.last = a.last;
  }

  return [...out, ...byEn.values()].sort((x, y) => y.n - x.n);
}

export const GALLERY_ARTISTS: GalleryArtist[] = merge(FILE.artists);

let index: Map<string, GalleryArtist> | null = null;

export function findGalleryArtist(
  nameKo: string | null | undefined,
  nameEn?: string | null
): GalleryArtist | null {
  if (!index) {
    index = new Map();
    for (const a of GALLERY_ARTISTS) {
      for (const alias of a.aliases) index.set(norm(alias), a);
      if (a.en) index.set(norm(a.en), a);
    }
  }
  for (const n of [nameKo, nameEn]) {
    if (!n) continue;
    const hit = index.get(norm(n));
    if (hit) return hit;
  }
  return null;
}

/**
 * 스토리·트렌딩용 순위. 건수만 쓰면 학고재가 밀어준 작가가 반년째 상단에 박혀 있게
 * 되므로, 최근성에 큰 가중을 준다 — 이 화면이 답해야 하는 건 "지금 누가 움직이나"다.
 */
export function rankedGalleryArtists(today: string, scope?: Scope, limit = 12): GalleryArtist[] {
  const now = Date.parse(today + "T00:00:00Z");

  return GALLERY_ARTISTS.filter((a) => !scope || a.scope === scope)
    .map((a) => {
      const days = Math.abs(now - Date.parse(a.last + "T00:00:00Z")) / 86400000;
      const recency = Math.exp(-days / 45);
      const breadth = 1 + 0.25 * (a.galleries.length - 1);
      return { a, s: Math.log1p(a.n) * recency * breadth };
    })
    .sort((x, y) => y.s - x.s)
    .slice(0, limit)
    .map((x) => x.a);
}
