import { GALLERIES, SHEETS, normalizeKind, type Kind, type GallerySource } from "./galleries";
import type { Scope } from "./data";

export type GalleryItem = {
  date: string;
  title: string;
  titleKo: string;
  keywords: string[];
  keywordsEn: string[];
  summary: string;
  category: string;
  kind: Kind;
  url: string;
  gallery: string;
  galleryTab: string;
  city: string;
  scope: Scope;
};

/**
 * gviz CSV는 탭 이름으로 바로 읽힌다 — gid를 찾는 htmlview 왕복이 필요 없고,
 * 탭 순서가 바뀌어도 안 깨진다. 링크 공개 시트라 인증도 필요 없다.
 */
function csvUrl(sheet: "west" | "kr", tab: string): string {
  return (
    `https://docs.google.com/spreadsheets/d/${SHEETS[sheet]}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
  );
}

/** RFC4180 파서. 요약 칸에 줄바꿈이 들어있어서 줄 단위로 자르면 안 된다. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function splitKeywords(s: string): string[] {
  return (s || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

async function readTab(g: GallerySource, signal: AbortSignal): Promise<GalleryItem[]> {
  const res = await fetch(csvUrl(g.sheet, g.tab), {
    signal,
    next: { revalidate: 3600, tags: ["gallery"] },
  });
  if (!res.ok) throw new Error(`${g.tab}: ${res.status}`);

  const rows = parseCsv(await res.text());
  const out: GalleryItem[] = [];

  // 0:날짜 1:제목 2:제목(한국어) 3:키워드(한글) 4:키워드(영문) 5:내용요약 6:카테고리 7:원문링크
  for (const r of rows.slice(1)) {
    const date = (r[0] ?? "").trim();
    const url = (r[7] ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !url.startsWith("http")) continue;

    const category = (r[6] ?? "").trim();
    out.push({
      date,
      title: (r[1] ?? "").trim(),
      titleKo: (r[2] ?? "").trim(),
      keywords: splitKeywords(r[3] ?? ""),
      keywordsEn: splitKeywords(r[4] ?? ""),
      summary: (r[5] ?? "").trim(),
      category,
      kind: normalizeKind(category),
      url,
      gallery: g.name,
      galleryTab: g.tab,
      city: g.city,
      scope: g.scope,
    });
  }
  return out;
}

/**
 * 탭 하나가 죽어도 나머지는 그대로 나온다. 전부 실패해도 던지지 않는다.
 * 전부 실패하면 빈 배열이고, 화면은 빈 상태 문구를 쓴다.
 */
export async function collectGalleryNews(opts: {
  scope?: Scope;
  kind?: Kind;
  gallery?: string;
} = {}): Promise<GalleryItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    let targets = GALLERIES;
    if (opts.scope) targets = targets.filter((g) => g.scope === opts.scope);
    if (opts.gallery) targets = targets.filter((g) => g.tab === opts.gallery);

    const settled = await Promise.allSettled(
      targets.map((g) => readTab(g, controller.signal))
    );

    const merged: GalleryItem[] = [];
    for (const r of settled) if (r.status === "fulfilled") merged.push(...r.value);

    const filtered = opts.kind ? merged.filter((i) => i.kind === opts.kind) : merged;
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    return filtered;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 한 갤러리가 목록을 독점하지 않게 갤러리당 상한을 둔다.
 * 학고재(97건)나 Ropac(241건)이 화면을 전부 먹으면 17곳을 붙인 의미가 없다.
 */
export function diversifyByGallery(
  items: GalleryItem[],
  limit: number,
  perGallery = 2
): GalleryItem[] {
  const used = new Map<string, number>();
  const picked: GalleryItem[] = [];

  for (const it of items) {
    const n = used.get(it.galleryTab) ?? 0;
    if (n >= perGallery) continue;
    used.set(it.galleryTab, n + 1);
    picked.push(it);
    if (picked.length >= limit) break;
  }
  return picked;
}

/** 키워드(한글) 칼럼을 집계해 “이번 주 키워드”를 만든다. */
export function trendingKeywords(
  items: GalleryItem[],
  limit = 14
): { term: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    // 첫 키워드는 거의 항상 작가 이름이라 키워드 구름에서는 뺀다 —
    // 작가는 트렌딩 목록이 따로 담당한다.
    for (const k of it.keywords.slice(1)) {
      if (k.length < 2) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}
