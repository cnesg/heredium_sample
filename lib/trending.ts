import { supabaseAnon } from "./supabase";

export type TrendRow = {
  artistId: string;
  nameKo: string | null;
  nameEn: string | null;
  nationality: string | null;
  mentionsThisWeek: number;
  mentionsLastWeek: number;
  growth: number;
};

/**
 * 최근 7일 언급량 기준 트렌딩 목록. /api/trending과 /api/stories가 같이 쓴다.
 */
export async function computeTrending(limit = 20): Promise<TrendRow[]> {
  const db = supabaseAnon();
  if (!db) return [];

  const now = new Date();
  const day = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const thisWeekStart = day(7);
  const lastWeekStart = day(14);

  const { data: rows, error } = await db
    .from("signals")
    .select("artist_id, value, weight, occurred_on")
    .in("axis", ["discourse", "attention"])
    .gte("occurred_on", lastWeekStart);

  if (error || !rows) return [];

  const byArtist = new Map<string, { thisWeek: number; lastWeek: number }>();
  for (const r of rows) {
    const w = (r.value ?? 1) * (r.weight ?? 1);
    const bucket = byArtist.get(r.artist_id) ?? { thisWeek: 0, lastWeek: 0 };
    if (r.occurred_on >= thisWeekStart) bucket.thisWeek += w;
    else bucket.lastWeek += w;
    byArtist.set(r.artist_id, bucket);
  }

  const ids = [...byArtist.keys()];
  if (ids.length === 0) return [];

  const { data: artists } = await db
    .from("artists")
    .select("id,name_ko,name_en,nationality")
    .in("id", ids);

  const infoOf = new Map((artists ?? []).map((a) => [a.id, a]));

  return ids
    .map((id) => {
      const { thisWeek, lastWeek } = byArtist.get(id)!;
      const growth = lastWeek === 0 ? (thisWeek > 0 ? 1 : 0) : (thisWeek - lastWeek) / lastWeek;
      const info = infoOf.get(id);
      return {
        artistId: id,
        nameKo: info?.name_ko ?? null,
        nameEn: info?.name_en ?? null,
        nationality: info?.nationality ?? null,
        mentionsThisWeek: thisWeek,
        mentionsLastWeek: lastWeek,
        growth,
      };
    })
    .sort((a, b) => b.mentionsThisWeek - a.mentionsThisWeek)
    .slice(0, limit);
}
