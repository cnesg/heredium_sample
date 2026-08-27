import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { runMentionExtraction } from "@/lib/mentions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 매일 07:00 KST(= 22:00 UTC)에 Vercel Cron이 호출한다.
 * 1) 뉴스·영상·갤러리 아카이브·인물사진 캐시를 비운다
 * 2) 오늘자 뉴스·영상·갤러리 소식에서 작가 언급을 뽑아 Supabase에 쌓는다
 * 언급 추출이 실패해도(키 미설정, API 오류 등) 피드 갱신 자체는 항상 성공시킨다.
 *
 * 경매 인덱스는 여기서 갱신되지 않는다 — 로컬 스크립트가 만들어 커밋하는 정적 파일이다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidateTag("news");
  revalidateTag("videos");
  revalidateTag("gallery");
  revalidateTag("photos");

  let mentions: Awaited<ReturnType<typeof runMentionExtraction>> | null = null;
  let mentionsError: string | null = null;
  try {
    mentions = await runMentionExtraction();
  } catch (e) {
    mentionsError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    refreshed: true,
    at: new Date().toISOString(),
    mentions,
    mentionsError,
  });
}
