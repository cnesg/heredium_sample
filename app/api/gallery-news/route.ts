import { NextResponse } from "next/server";
import { collectGalleryNews, diversifyByGallery, trendingKeywords } from "@/lib/gallerySheet";
import { GALLERIES, KIND_LABEL, type Kind } from "@/lib/galleries";
import type { Scope } from "@/lib/data";

export const revalidate = 3600;

const KINDS = Object.keys(KIND_LABEL) as Kind[];

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const scope = p.get("scope") === "intl" ? "intl" : p.get("scope") === "kr" ? "kr" : undefined;
  const kind = KINDS.includes(p.get("kind") as Kind) ? (p.get("kind") as Kind) : undefined;
  const gallery = p.get("gallery") ?? undefined;
  const limit = Math.min(120, Number(p.get("limit")) || 12);
  const perGallery = Number(p.get("perGallery")) || 2;

  const all = await collectGalleryNews({ scope: scope as Scope | undefined, kind, gallery });

  // 갤러리 하나를 지정해 보는 중이면 상한을 걸 이유가 없다.
  const items = gallery ? all.slice(0, limit) : diversifyByGallery(all, limit, perGallery);

  return NextResponse.json({
    items,
    total: all.length,
    keywords: trendingKeywords(all),
    galleries: GALLERIES.filter((g) => !scope || g.scope === scope).map((g) => ({
      tab: g.tab,
      name: g.name,
      city: g.city,
      scope: g.scope,
      count: all.filter((i) => i.galleryTab === g.tab).length,
    })),
  });
}
