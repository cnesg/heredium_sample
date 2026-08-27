import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";
import { upcomingFairs, fairStatus, daysUntil, formatFairDates, type Fair } from "@/lib/fairs";
import { todayKST } from "@/lib/edition";

export const dynamic = "force-dynamic";

export type FairRow = {
  id: string;
  name: string;
  nameKo: string | null;
  city: string;
  country: string;
  scope: string;
  kind: string;
  dates: string;
  start: string | null;
  end: string | null;
  status: string;
  daysUntil: number | null;
  venue: string | null;
  note: string | null;
  url: string | null;
  tier: number;
  source: "calendar" | "supabase";
};

function toRow(f: Fair, today: string): FairRow {
  return {
    id: f.id,
    name: f.name,
    nameKo: f.nameKo ?? null,
    city: f.city,
    country: f.country,
    scope: f.scope,
    kind: f.kind,
    dates: formatFairDates(f),
    start: f.start,
    end: f.end,
    status: fairStatus(f, today),
    daysUntil: daysUntil(f, today),
    venue: f.venue ?? null,
    note: f.note ?? null,
    url: f.url ?? null,
    tier: f.tier,
    source: "calendar",
  };
}

/**
 * 정적 캘린더(lib/fairs.ts)가 기본이고, Supabase에 수동 등록한 행사가 있으면 덧붙인다.
 * 순서를 이렇게 둔 이유: Vercel 크론은 로컬 데이터를 못 보고 Supabase는 비어 있을 수
 * 있는데, 캘린더는 어떤 경우에도 화면에 나와야 한다.
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const scope = p.get("scope") === "intl" ? "intl" : p.get("scope") === "kr" ? "kr" : undefined;
  const limit = Number(p.get("limit")) || 0;
  const today = todayKST();

  const rows: FairRow[] = upcomingFairs(today, { scope }).map((f) => toRow(f, today));

  const db = supabaseAnon();
  if (db) {
    const { data } = await db
      .from("exhibitions")
      .select("id,title,starts_on,ends_on,summary,source_url,venues(name,city,country)")
      .in("exhibit_type", ["fair", "biennale"])
      .or(`ends_on.is.null,ends_on.gte.${today}`)
      .order("starts_on", { ascending: true })
      .limit(20);

    for (const e of data ?? []) {
      // supabase-js는 조인 결과를 배열로 타이핑하지만 단일 FK라 실제로는 객체 하나다.
      const v = e.venues as unknown as { name: string; city: string | null; country: string | null }[] | { name: string; city: string | null; country: string | null } | null;
      const venue = Array.isArray(v) ? v[0] ?? null : v;
      // 정적 캘린더에 이미 있는 행사는 건너뛴다.
      if (rows.some((r) => r.name.toLowerCase() === (e.title ?? "").toLowerCase())) continue;
      rows.push({
        id: e.id,
        name: e.title ?? "제목 없음",
        nameKo: null,
        city: venue?.city ?? "",
        country: venue?.country ?? "",
        scope: venue?.country === "KR" ? "kr" : "intl",
        kind: "fair",
        dates: e.starts_on ?? "일정 미정",
        start: e.starts_on,
        end: e.ends_on,
        status: e.starts_on && e.starts_on <= today ? "ongoing" : "upcoming",
        daysUntil: null,
        venue: venue?.name ?? null,
        note: e.summary ?? null,
        url: e.source_url ?? null,
        tier: 2,
        source: "supabase",
      });
    }
  }

  return NextResponse.json(
    { fairs: limit ? rows.slice(0, limit) : rows, today },
    { headers: { "cache-control": "no-store" } }
  );
}
