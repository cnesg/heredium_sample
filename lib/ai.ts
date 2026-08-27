/**
 * AI 기능 스위치.
 *
 * 이 사이트의 화면은 거의 전부 API 호출 없이 돈다 — 갤러리 아카이브와 뉴스(구글 시트),
 * 경매 인덱스(동봉 파일), 페어 캘린더, 유튜브, 위키 사진이 모두 무료다.
 * Claude를 부르는 곳은 이제 둘뿐이다.
 *
 *   extract — 크론에서 하루 한 번. 방문자 수와 무관하고 월 500원 안팎.
 *   ask     — 질문할 때마다. 공개 엔드포인트라 상한이 없으므로 호출 제한과 함께 쓴다.
 *
 * 여기 있던 셋이 사라진 경위:
 *   translate·geo — Apps Script가 시트에 쌓을 때 LanguageApp으로 번역한다. 내장 함수라
 *                   공짜이고, 번역 결과가 시트에 남아 같은 기사를 두 번 번역하지 않는다.
 *   summary       — `lib/why.ts`가 순위 계산에 쓴 수를 그대로 문장으로 조립한다. 모델이
 *                   지어낼 여지가 없고, 화면의 근거가 실제 계산 근거와 항상 일치한다.
 */

export type AiFeature =
  /** 뉴스·영상에서 작가 이름 추출 (크론, 하루 1회) */
  | "extract"
  /** 챗봇 (질문할 때마다) */
  | "ask";

const DEFAULTS: Record<AiFeature, boolean> = {
  extract: true,
  ask: true,
};

const ENV_NAME: Record<AiFeature, string> = {
  extract: "AI_EXTRACT",
  ask: "AI_ASK",
};

function parse(v: string | undefined): boolean | null {
  if (v === undefined) return null;
  const s = v.trim().toLowerCase();
  if (["1", "on", "true", "yes", "y"].includes(s)) return true;
  if (["0", "off", "false", "no", "n"].includes(s)) return false;
  return null;
}

export function aiEnabled(feature: AiFeature): boolean {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  return parse(process.env[ENV_NAME[feature]]) ?? DEFAULTS[feature];
}

/**
 * 아주 단순한 IP 단위 호출 제한. 서버리스라 인스턴스마다 메모리가 따로 놀지만,
 * 그래도 한 인스턴스에 몰아치는 요청은 막는다 — 완벽한 방어가 아니라 사고 방지용이다.
 * 진짜 상한은 Anthropic Console의 지출 한도로 걸어야 한다.
 */
const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    const oldest = recent[0];
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // 오래된 키를 정리하지 않으면 맵이 계속 자란다. 서버리스 인스턴스는 오래 살지 않지만
  // 그래도 상한을 둔다.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return { ok: true, retryAfterSec: 0 };
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
