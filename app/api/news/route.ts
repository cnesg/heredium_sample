import { NextResponse } from "next/server";
import { collectNewsFromSheet, newsConfigured, displayTitle, displaySub } from "@/lib/newsSheet";
import type { Scope } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * 뉴스는 Apps Script가 6시간마다 시트에 채워둔 것을 읽기만 한다.
 * 서버에서 RSS를 긁지도, 번역 API를 부르지도 않는다 — `lib/newsSheet.ts` 참고.
 */
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("scope");
  const scope: Scope = param === "intl" ? "intl" : "kr";

  if (!newsConfigured()) {
    return NextResponse.json(
      {
        scope,
        articles: [],
        error: "unconfigured",
        note: "뉴스 시트가 아직 연결되지 않았습니다. NEWS_SHEET_ID를 등록해 주세요.",
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  const items = await collectNewsFromSheet(scope);

  return NextResponse.json(
    {
      scope,
      count: items.length,
      articles: items.map((n) => ({
        title: displayTitle(n),
        summary: displaySub(n),
        url: n.url,
        source: n.source,
        date: n.date,
      })),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
