import { FAIRS, fairStatus, formatFairDates, daysUntil } from "./fairs";
import { findMarketArtist, marketScore, formatKRW, bandLabel, RECENT, MARKET_META } from "./market";
import { GALLERY_ARTISTS, findGalleryArtist, rankedGalleryArtists } from "./galleryArtists";
import { collectGalleryNews } from "./gallerySheet";
import { GALLERIES } from "./galleries";
import { todayKST } from "./edition";

/**
 * 챗봇이 쓰는 도구들. 이 사이트가 실제로 갖고 있는 데이터만 다룬다 —
 * 모르는 건 웹 검색(Anthropic 서버측 도구)이 맡고, 여기서는 지어내지 않는다.
 */

export type ToolResult = { ok: true; data: unknown } | { ok: false; reason: string };

async function searchFairs(input: { query?: string; scope?: string; month?: string }): Promise<ToolResult> {
  const today = todayKST();
  const q = (input.query ?? "").trim().toLowerCase();

  let list = FAIRS.filter((f) => {
    if (input.scope && f.scope !== input.scope) return false;
    if (input.month && f.start && !f.start.startsWith(input.month)) return false;
    if (!q) return true;
    return [f.name, f.nameKo, f.city, f.country, f.venue, f.note]
      .filter(Boolean)
      .some((s) => (s as string).toLowerCase().includes(q));
  });

  if (list.length === 0) return { ok: false, reason: "캘린더에 해당하는 행사가 없습니다." };

  list = list.sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999"));

  return {
    ok: true,
    data: list.slice(0, 12).map((f) => ({
      name: f.name,
      nameKo: f.nameKo ?? null,
      city: f.city,
      venue: f.venue ?? null,
      dates: formatFairDates(f),
      start: f.start,
      end: f.end,
      status: fairStatus(f, today),
      daysUntil: daysUntil(f, today),
      kind: f.kind,
      note: f.note ?? null,
      url: f.url ?? null,
    })),
  };
}

async function lookupArtist(input: { name: string }): Promise<ToolResult> {
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, reason: "이름이 비어 있습니다." };

  const market = findMarketArtist(name, name);
  const gallery = findGalleryArtist(name, name);
  if (!market && !gallery) {
    return { ok: false, reason: `"${name}"은(는) 이 사이트의 경매 인덱스와 갤러리 아카이브 어디에도 없습니다. 웹 검색으로 답하세요.` };
  }

  let items: unknown[] = [];
  if (gallery) {
    const all = await collectGalleryNews({ scope: gallery.scope }).catch(() => []);
    const names = new Set(gallery.aliases);
    items = all
      .filter((i) => i.keywords[0] && names.has(i.keywords[0]))
      .slice(0, 8)
      .map((i) => ({ date: i.date, title: i.titleKo || i.title, gallery: i.gallery, kind: i.kind, summary: i.summary, url: i.url }));
  }

  return {
    ok: true,
    data: {
      nameKo: market?.ko ?? gallery?.ko ?? name,
      nameEn: market?.en ?? gallery?.en ?? null,
      auction: market
        ? {
            source: "서울옥션·케이옥션 공개 경매 결과",
            coverage: MARKET_META.coverage,
            lots: market.lots,
            sold: market.sold,
            sellThrough: `${Math.round((market.sold / market.lots) * 100)}%`,
            medianHammer: formatKRW(market.medianHammer),
            lastSale: market.lastSale,
            recent24Months: { lots: market.r24.lots, sold: market.r24.sold, estimateBand: bandLabel(market.r24.band) },
            marketScore: marketScore(market),
            yearlyMedian: market.series.map((s) => ({ year: s.y, lots: s.n, median: formatKRW(s.med) })),
            recentLots: market.recent.map((l) => ({
              date: l.date, title: l.title, year: l.year, medium: l.medium,
              estimate: `${formatKRW(l.estLow)}–${formatKRW(l.estHigh)}`,
              hammer: l.sold ? formatKRW(l.hammer) : "유찰",
              house: l.house, sale: l.sale,
            })),
          }
        : null,
      galleryNews: gallery
        ? { count: gallery.n, galleries: gallery.galleries, latest: gallery.last, items }
        : null,
    },
  };
}

async function searchGalleryNews(input: { query?: string; gallery?: string; kind?: string; scope?: string; limit?: number }): Promise<ToolResult> {
  const all = await collectGalleryNews({
    scope: input.scope === "kr" || input.scope === "intl" ? input.scope : undefined,
    gallery: input.gallery,
  }).catch(() => []);

  const q = (input.query ?? "").trim().toLowerCase();
  const filtered = all.filter((i) => {
    if (input.kind && i.kind !== input.kind) return false;
    if (!q) return true;
    return `${i.title} ${i.titleKo} ${i.summary} ${i.keywords.join(" ")} ${i.gallery}`.toLowerCase().includes(q);
  });

  if (filtered.length === 0) return { ok: false, reason: "갤러리 아카이브에 해당하는 항목이 없습니다." };

  return {
    ok: true,
    data: {
      total: filtered.length,
      items: filtered.slice(0, Math.min(15, input.limit ?? 10)).map((i) => ({
        date: i.date, gallery: i.gallery, city: i.city, kind: i.kind,
        title: i.titleKo || i.title, summary: i.summary, keywords: i.keywords, url: i.url,
      })),
    },
  };
}

async function marketOverview(): Promise<ToolResult> {
  const months = RECENT.months.slice(-14);
  return {
    ok: true,
    data: {
      source: "서울옥션·케이옥션 공개 경매 결과를 직접 집계",
      coverage: MARKET_META.coverage,
      totalLots: MARKET_META.lotCount,
      artists: MARKET_META.artistCount,
      note: "낙찰가가 추정가 구간 어디에 떨어졌는지를 band로 잰다. 0=하한, 1=상한. 국내 시장 전체 중앙값이 0.0이라 0을 넘으면 평균 이상이다.",
      monthly: months.map((m) => ({
        month: m.m, lots: m.lots, sold: m.sold,
        sellThrough: `${Math.round((m.sold / Math.max(1, m.lots)) * 100)}%`,
        turnover: formatKRW(m.hammer),
      })),
      risers: RECENT.risers.slice(0, 10).map((r) => ({
        name: r.ko ?? r.en, recentSold: r.r24.sold, estimateBand: bandLabel(r.r24.band), medianHammer: formatKRW(r.medianHammer),
      })),
      notableResults: RECENT.notable.slice(0, 10).map((n) => ({
        date: n.date, artist: n.artistKo ?? n.artist, title: n.title,
        hammer: formatKRW(n.hammer), estimate: `${formatKRW(n.estLow)}–${formatKRW(n.estHigh)}`, house: n.house,
      })),
    },
  };
}

async function listSources(): Promise<ToolResult> {
  const today = todayKST();
  return {
    ok: true,
    data: {
      galleries: GALLERIES.map((g) => ({ name: g.name, city: g.city, scope: g.scope, site: g.site })),
      galleryArtistsTracked: GALLERY_ARTISTS.length,
      topArtistsNow: {
        kr: rankedGalleryArtists(today, "kr", 8).map((a) => a.ko),
        intl: rankedGalleryArtists(today, "intl", 8).map((a) => a.ko),
      },
      auction: { houses: MARKET_META.houses, lots: MARKET_META.lotCount, coverage: MARKET_META.coverage },
      fairsTracked: FAIRS.length,
    },
  };
}

/**
 * ARTREND 온톨로지(맥미니의 Ontological Studio). 사이트에서 직접 닿지 않으므로
 * 맥미니의 gateway(Cloudflare Tunnel 뒤, Bearer 토큰)로 부른다. 읽기 전용이다.
 */
async function ontology(path: "/artist" | "/cypher", body: unknown): Promise<ToolResult> {
  const base = process.env.ONTOLOGY_URL?.replace(/\/+$/, "");
  const token = process.env.ONTOLOGY_TOKEN;
  if (!base || !token) return { ok: false, reason: "온톨로지 연결 설정(ONTOLOGY_URL·ONTOLOGY_TOKEN)이 없습니다." };

  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return { ok: false, reason: `온톨로지 서버 응답 ${res.status} — 맥미니가 꺼져 있을 수 있습니다.` };

  const data = (await res.json()) as Record<string, unknown>;
  if (data.error) return { ok: false, reason: String(data.error) };
  if (data.found === false) return { ok: false, reason: String(data.reason) };
  return { ok: true, data };
}

async function ontologyArtist(input: { name: string }): Promise<ToolResult> {
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, reason: "이름이 비어 있습니다." };
  return ontology("/artist", { name });
}

async function ontologyQuery(input: { query: string; params?: Record<string, unknown> }): Promise<ToolResult> {
  return ontology("/cypher", { query: input.query ?? "", params: input.params ?? {} });
}

export const TOOLS = [
  {
    name: "ontology_artist",
    description:
      "ARTREND 온톨로지에서 작가 한 명의 전체 기록을 가져온다. 프로필(위키데이터 기준 생몰년·국적·한글명), " +
      "전시 이력(MoMA·국립현대미술관·퐁피두·주요 갤러리, 최근순), 최근 뉴스(세계 미술 매체·국내 언론, 최신순), 비엔날레 참여·수상, " +
      "소장처, 전속 갤러리, 아트페어 출품, MoMA 소장 작품 수, 국내외 공개 경매 로트 집계를 한 번에 돌려준다. " +
      "작가 이름이 나오는 질문에는 이 도구를 가장 먼저 쓴다. 한글·영문 이름 모두 된다.",
    input_schema: {
      type: "object" as const,
      properties: { name: { type: "string", description: "작가 이름(한글 또는 영문, 예: 피카소, Haegue Yang)" } },
      required: ["name"],
    },
    run: ontologyArtist,
  },
  {
    name: "ontology_query",
    description:
      "ARTREND 온톨로지에 읽기 전용 Cypher를 직접 보낸다. ontology_artist로 답이 안 되는 질문(기관별 전시, 기간별 집계, " +
      "여러 작가 비교 등)에만 쓴다. 결과는 최대 20행이라 ORDER BY·LIMIT·count()로 줄여서 묻는다. CALL {} 서브쿼리는 안 된다.\n" +
      "노드: Artist(uid,name,aliases,birth_year,death_year,nationality,content), Event(name,start_date,end_date,year,kind=exhibition|collection_gallery|program|performance|film,url), " +
      "Institution(name,kind,url,content), Article(name=제목,aliases=한글제목(일부),content=한글요약 또는 원문 발췌,start_date,url) — 세계 미술 매체·국내 언론 기사 2만여 건(2025~), " +
      "BiennaleEdition(name,year), Person(name), Source(name), " +
      "AuctionLot(house,sale_date,title,status,price,currency,price_basis,amount_usd,est_low,est_high), " +
      "MomaArtwork(title,classification,date_acquired).\n" +
      "관계: (Artist)-[:EXHIBITED_IN]->(Event)-[:HELD_AT]->(Institution), (Person)-[:CURATED]->(Event), " +
      "(Artist)-[:PARTICIPATED_IN|WON_AWARD]->(BiennaleEdition), (Artist)-[:IN_COLLECTION_OF|REPRESENTED_BY]->(Institution), " +
      "(Artist)-[:PRESENTED_BY]->(Institution), (Article)-[:MENTIONS]->(Artist|Institution), (Article)-[:PUBLISHED_BY]->(Institution), " +
      "(AuctionLot)-[:OF_ARTIST]->(Artist), (MomaArtwork)-[:BY_ARTIST]->(Artist). " +
      "날짜는 'YYYY-MM-DD' 문자열이라 문자열 비교로 거른다. 한글 이름은 toString(a.aliases) CONTAINS $n 으로 찾는다.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "읽기 전용 Cypher (MATCH/WHERE/WITH/RETURN)" },
        params: { type: "object", description: "쿼리 파라미터 ($이름)" },
      },
      required: ["query"],
    },
    run: ontologyQuery,
  },
  {
    name: "search_fairs",
    description:
      "ARTREND의 2026 아트페어·비엔날레 캘린더를 검색한다. 아트바젤·프리즈·키아프·베네치아 비엔날레 등 " +
      "특정 행사가 언제/어디서 열리는지, 다가오는 행사가 무엇인지 묻는 질문에 반드시 이 도구를 먼저 쓴다.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "행사명·도시·국가로 검색. 비우면 전체." },
        scope: { type: "string", enum: ["kr", "intl"], description: "국내/해외" },
        month: { type: "string", description: "YYYY-MM 형식으로 특정 월만" },
      },
    },
    run: searchFairs,
  },
  {
    name: "lookup_artist",
    description:
      "작가 한 명의 실제 데이터를 가져온다. 서울옥션·케이옥션 낙찰 이력(낙찰가 중앙값, 낙찰률, 연도별 추이, " +
      "최근 낙찰 결과)과 갤러리 뉴스 아카이브의 전시·소식을 함께 돌려준다. 작가 이름이 나오는 질문에는 반드시 먼저 쓴다. " +
      "데이터가 없으면 그렇게 알려주므로, 그때 웹 검색으로 넘어가면 된다.",
    input_schema: {
      type: "object" as const,
      properties: { name: { type: "string", description: "작가 이름(한글 또는 영문)" } },
      required: ["name"],
    },
    run: lookupArtist,
  },
  {
    name: "search_gallery_news",
    description:
      "국내외 갤러리 17곳(가고시안·하우저앤워스·페이스·화이트큐브·국제갤러리·갤러리현대·학고재 등)의 뉴스 아카이브를 검색한다. " +
      "지금 어떤 전시가 열리는지, 특정 갤러리가 무엇을 하는지 묻는 질문에 쓴다.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "제목·요약·키워드 검색어" },
        gallery: { type: "string", description: "갤러리 탭 이름(예: kukje, gagosian, hakgojae)" },
        kind: { type: "string", enum: ["exhibition", "fair", "event", "press", "media"] },
        scope: { type: "string", enum: ["kr", "intl"] },
        limit: { type: "number" },
      },
    },
    run: searchGalleryNews,
  },
  {
    name: "market_overview",
    description:
      "국내 미술시장 전체 흐름. 월별 출품·낙찰 수와 낙찰총액, 추정가를 넘겨 낙찰된 작가들, 최근 눈에 띈 낙찰 결과. " +
      "'요즘 시장 어때?' 같은 질문에 쓴다.",
    input_schema: { type: "object" as const, properties: {} },
    run: marketOverview,
  },
  {
    name: "list_sources",
    description: "이 사이트가 어떤 데이터를 갖고 있는지 — 추적 중인 갤러리, 경매사, 작가 수, 지금 가장 활발한 작가.",
    input_schema: { type: "object" as const, properties: {} },
    run: listSources,
  },
] as const;

export const SYSTEM_PROMPT = `당신은 ARTREND의 안내자다. ARTREND는 국내외 미술 동향을 한 화면에서 보여주는 대시보드다.

오늘은 ${"{{TODAY}}"} (한국 시간)이다.

## 답하는 방식
- 반드시 한국어로, 짧고 단정하게 답한다. 서론 없이 바로 답부터 말한다.
- 도구를 먼저 쓴다. 작가·페어·전시·시장 질문은 이 사이트가 실제 데이터를 갖고 있다.
- 작가 질문은 ontology_artist를 먼저 쓴다. 프로필 → 최근 전시 → 최근 뉴스 → 비엔날레·소장·전속 → 경매 순서로
  정리하고, 국내 경매 세부(낙찰가 중앙값·낙찰률)가 필요하면 lookup_artist를 함께 쓴다.
- 영문 기사는 한국어로 옮겨 요약하고, 매체명과 날짜, 원문 링크를 함께 적는다.
- 온톨로지 결과에 other_candidates가 있으면 동명이인일 수 있다고 짧게 알린다.
- 연도만 있는 날짜는 연도만 말한다. 날짜를 지어내지 않는다. 값이 없으면 "기록 없음"이지 0이 아니다.
- 경매는 보조 지표다. 가격을 작품의 예술적 가치처럼 말하지 않는다.
- 도구가 데이터를 못 찾으면 웹 검색으로 보완한다. 어느 쪽에서 온 정보인지 밝힌다
  ("ARTREND 경매 데이터 기준" / "웹 검색 결과").
- 숫자는 도구가 준 값을 그대로 쓴다. 어림하거나 계산해서 새 숫자를 만들지 않는다.
- 모르면 모른다고 한다. 지어내지 않는다.

## 시장 데이터를 말할 때
- 경매 데이터는 서울옥션·케이옥션 공개 결과이며 국내 시장만 다룬다. 해외 경매는 없다.
- band는 낙찰가가 추정가 구간 어디에 떨어졌는지다(0=하한, 1=상한). 국내 시장 중앙값이
  정확히 0.0이라, 0을 넘으면 평균 이상이라는 뜻이다. 이 맥락 없이 숫자만 던지지 않는다.
- 특정 작품이나 작가의 가격을 예측하거나 투자를 권하지 않는다. 과거 낙찰 기록을 사실로
  전달할 뿐이다. 투자 판단을 묻는 질문에는 자료만 제시하고 판단은 하지 않는다.

## 하지 않는 것
- 작품 이미지를 만들거나 링크하지 않는다.
- 확인되지 않은 전시 일정이나 가격을 말하지 않는다.`;
