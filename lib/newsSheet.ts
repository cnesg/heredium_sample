import type { Scope } from "./data";
import { parseCsv } from "./gallerySheet";

/**
 * 뉴스 아카이브. Apps Script(`news/apps_script/Code_news.gs`)가 6시간마다 RSS를
 * 모아 한국어로 번역해 시트에 쌓고, 사이트는 그 시트만 읽는다.
 *
 * RSS를 서버에서 직접 가져오던 구조를 왜 바꿨나
 *   - 번역이 공짜가 된다. LanguageApp은 Apps Script 내장이라 과금이 없다.
 *   - 번역 결과가 시트에 남아 같은 기사를 두 번 번역하지 않는다.
 *   - 30여 개 피드를 요청 때마다 병렬로 긁던 것이 CSV 두 장 읽기로 줄었다.
 *   - 수집이 구글 서버에서 돌아 배포 상태나 맥 전원과 무관해진다.
 *
 * 시트를 갈아끼우려면 NEWS_SHEET_ID 환경변수를 주거나 아래 상수를 바꾼다.
 * 비어 있으면 뉴스 영역만 안내 문구로 바뀌고 나머지 화면은 그대로 동작한다.
 */

// 갤러리 시트들과 같은 방식으로 코드에 둔다 — 공개 시트의 읽기 전용 ID라 비밀이 아니고,
// 환경변수로 두면 로컬과 배포 어느 한쪽에만 있어 조용히 빈 화면이 되기 쉽다.
// 환경변수가 있으면 그쪽이 이긴다(시트를 갈아끼울 때 재배포 없이 바꾸려고).
export const NEWS_SHEET_ID =
  process.env.NEWS_SHEET_ID || "1hCGEpq6fUdsNzr-vHEfNCuYkxQPP8S7CaIiOaBHhZwM";

const TAB: Record<Scope, string> = { kr: "국내", intl: "해외" };

export type NewsItem = {
  date: string;
  source: string;
  title: string;
  titleKo: string;
  summary: string;
  url: string;
  scope: Scope;
};

export function newsConfigured(): boolean {
  return NEWS_SHEET_ID.length > 0;
}

/** 화면에 띄울 제목. 번역이 있으면 그것을, 없으면 원문을 쓴다. */
export function displayTitle(n: NewsItem): string {
  return n.titleKo || n.title;
}

/** 번역된 제목을 쓰는 경우에만 원문을 보조 텍스트로 남긴다. */
export function displaySub(n: NewsItem): string {
  if (n.summary) return n.summary;
  return n.titleKo ? n.title : "";
}

async function fetchRows(scope: Scope): Promise<NewsItem[]> {
  if (!newsConfigured()) return [];

  const url =
    `https://docs.google.com/spreadsheets/d/${NEWS_SHEET_ID}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB[scope])}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 1800, tags: ["news"] },
    } as RequestInit);
    if (!res.ok) return [];

    const rows = parseCsv(await res.text());
    const out: NewsItem[] = [];

    // 0:날짜 1:매체 2:제목 3:제목(한국어) 4:요약(한국어) 5:원문링크
    for (const r of rows.slice(1)) {
      const date = (r[0] ?? "").trim();
      const link = (r[5] ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !link.startsWith("http")) continue;
      out.push({
        date,
        source: (r[1] ?? "").trim(),
        title: (r[2] ?? "").trim(),
        titleKo: (r[3] ?? "").trim(),
        summary: (r[4] ?? "").trim(),
        url: link,
        scope,
      });
    }

    out.sort((a, b) => b.date.localeCompare(a.date));
    return out;
  } catch {
    return [];
  }
}

/**
 * 한 매체가 목록을 독점하지 않게 매체당 상한을 둔다. Apps Script 쪽에서도 수집 시
 * 상한을 두지만, 시트에는 회차가 계속 쌓이므로 화면에서 한 번 더 건다.
 */
export async function collectNewsFromSheet(scope: Scope, limit = 14): Promise<NewsItem[]> {
  const all = await fetchRows(scope);
  const used = new Map<string, number>();
  const picked: NewsItem[] = [];
  for (const n of all) {
    const c = used.get(n.source) ?? 0;
    if (c >= 2) continue;
    used.set(n.source, c + 1);
    picked.push(n);
    if (picked.length >= limit) break;
  }
  return picked;
}

/** 수집 중인 매체 목록. /sources 페이지가 실제 시트에서 읽어 보여준다. */
export async function newsSources(scope: Scope): Promise<{ source: string; count: number }[]> {
  const all = await fetchRows(scope).catch(() => []);
  const counts = new Map<string, number>();
  for (const n of all) counts.set(n.source, (counts.get(n.source) ?? 0) + 1);
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}
