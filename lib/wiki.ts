/**
 * 작가 인물사진을 위키피디아에서 찾는다. 작품 이미지와 달리 위키피디아
 * 인물사진은 CC 라이선스가 명확해 재사용이 가능하다.
 * 한국어 위키 우선, 없으면 영어 위키로 재시도. 둘 다 없으면 null —
 * 신진 작가는 위키 문서가 아직 없는 경우가 많아 이게 정상이다.
 */

// User-Agent 없이 부르면 위키피디아가 403을 준다. 조용히 사진만 빠지므로
// 원인을 찾기 어려웠다 — 반드시 붙일 것.
const UA = "ARTREND/0.2 (art trend dashboard; contact via site)";

type Page = { title: string; thumbnail?: { source: string } };

/**
 * 한 번에 최대 50개까지 조회한다. 작가 12명을 개별 호출하면 24번을 두드리게 되고
 * 위키피디아가 일부를 흘려버려 사진이 들쭉날쭉해진다.
 */
async function lookupBatch(titles: string[], lang: "ko" | "en"): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (titles.length === 0) return out;

  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=200&redirects=1` +
    `&titles=${encodeURIComponent(titles.slice(0, 50).join("|"))}`;

  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 604800, tags: ["photos"] },
    } as RequestInit);
    if (!res.ok) return out;

    const json = await res.json();
    const q = json?.query;
    if (!q) return out;

    // 표제어 정규화·리다이렉트를 거치면 응답의 title이 요청한 문자열과 달라진다.
    const alias = new Map<string, string>();
    for (const n of [...(q.normalized ?? []), ...(q.redirects ?? [])]) {
      alias.set(n.to, alias.get(n.from) ?? n.from);
    }

    for (const p of (q.pages ?? []) as Page[]) {
      if (!p.thumbnail?.source) continue;
      out.set(alias.get(p.title) ?? p.title, p.thumbnail.source);
    }
  } catch {
    // 사진이 없는 건 화면이 감당한다(이니셜 아바타). 여기서 던지지 않는다.
  }
  return out;
}

/** 여러 작가의 사진을 한꺼번에. 키는 넘긴 nameKo(없으면 nameEn). */
export async function findArtistPhotos(
  people: { nameKo: string | null; nameEn: string | null }[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const koNames = people.map((p) => p.nameKo).filter((n): n is string => Boolean(n));
  const ko = await lookupBatch(koNames, "ko");
  for (const [title, src] of ko) result.set(title, src);

  const stillMissing = people.filter(
    (p) => p.nameEn && !(p.nameKo && result.has(p.nameKo))
  );
  const en = await lookupBatch(
    stillMissing.map((p) => p.nameEn as string),
    "en"
  );

  for (const p of stillMissing) {
    const src = en.get(p.nameEn as string);
    if (src) result.set(p.nameKo ?? (p.nameEn as string), src);
  }

  return result;
}

export async function findArtistPhoto(
  nameKo: string | null,
  nameEn: string | null
): Promise<string | null> {
  const m = await findArtistPhotos([{ nameKo, nameEn }]);
  return m.get(nameKo ?? nameEn ?? "") ?? null;
}
