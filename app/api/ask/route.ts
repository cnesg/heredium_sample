import { NextResponse } from "next/server";
import { TOOLS, SYSTEM_PROMPT } from "@/lib/ask";
import { todayKST } from "@/lib/edition";
import { aiEnabled, rateLimit, clientKey } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ASK_MODEL || "claude-sonnet-5";
const MAX_TURNS = 5;

/** IP 하나당 시간당 질문 수. ASK_PER_HOUR로 조절한다. */
const ASK_PER_HOUR = Number(process.env.ASK_PER_HOUR) || 10;

/** 웹 검색은 1,000회당 $10로 따로 과금된다. 아예 끄려면 ASK_WEB_SEARCH=off. */
const WEB_SEARCH_MAX_USES = Number(process.env.ASK_WEB_SEARCH_MAX) || 3;
const WEB_SEARCH_ON = (process.env.ASK_WEB_SEARCH ?? "on").toLowerCase() !== "off";

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: string; [k: string]: unknown };

type Msg = { role: "user" | "assistant"; content: string | Block[] };

const RUNNERS: Map<string, (i: never) => Promise<unknown>> = new Map(
  TOOLS.map((t) => [t.name as string, t.run as (i: never) => Promise<unknown>])
);

const TOOL_SPECS = [
  ...TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema })),
  // Anthropic 서버측 웹 검색. 사이트 데이터에 없는 건 여기서 답을 찾는다.
  // 토큰과 별개로 검색 1,000회당 $10이 붙으므로 max_uses로 상한을 둔다.
  ...(WEB_SEARCH_ON
    ? [{ type: "web_search_20250305", name: "web_search", max_uses: WEB_SEARCH_MAX_USES }]
    : []),
];

/** 화면이 "물어보기" 버튼을 띄울지 판단하는 데 쓴다 — 꺼져 있으면 버튼 자체를 없앤다. */
export async function GET() {
  return NextResponse.json({ enabled: aiEnabled("ask") });
}

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;

  // 공개 엔드포인트라 호출량에 상한이 없다 — 이 사이트에서 유일하게 비용이 튈 수 있는
  // 지점이라 기본은 꺼짐이다. AI_ASK=on으로 켠다.
  if (!key || !aiEnabled("ask")) {
    return NextResponse.json(
      { error: "disabled", answer: "챗봇이 꺼져 있습니다." },
      { status: 200 }
    );
  }

  // 켜져 있어도 한 사람이 몰아치는 건 막는다. 진짜 상한은 Anthropic Console의
  // 지출 한도로 걸어야 한다 — 이건 사고 방지용이다.
  const limit = rateLimit(clientKey(request), { max: ASK_PER_HOUR, windowMs: 3600_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { answer: `질문이 너무 잦습니다. ${Math.ceil(limit.retryAfterSec / 60)}분 뒤에 다시 물어봐 주세요.` },
      { status: 200 }
    );
  }

  let body: { question?: string; history?: Msg[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, 1000);
  if (!question) return NextResponse.json({ error: "empty" }, { status: 400 });

  // 대화가 길어져도 요청이 무한히 커지지 않게 최근 6턴만 유지한다.
  const messages: Msg[] = [...(body.history ?? []).slice(-6), { role: "user", content: question }];
  const system = SYSTEM_PROMPT.replace("{{TODAY}}", todayKST());
  const used: string[] = [];

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1600, system, tools: TOOL_SPECS, messages }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error("ask: anthropic", res.status, detail.slice(0, 400));
        return NextResponse.json(
          { answer: "지금은 답할 수 없습니다. 잠시 뒤 다시 물어봐 주세요.", error: "upstream" },
          { status: 200 }
        );
      }

      const json = (await res.json()) as { content: Block[]; stop_reason: string };
      const content = json.content ?? [];

      if (json.stop_reason !== "tool_use") {
        const answer = content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({
          answer: answer || "답을 만들지 못했습니다.",
          tools: used,
          history: [...messages, { role: "assistant" as const, content }],
        });
      }

      // 서버측 web_search는 API가 알아서 실행한다 — 우리가 돌릴 건 로컬 도구뿐이다.
      const calls = content.filter(
        (b): b is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
          b.type === "tool_use" && RUNNERS.has(b.name as string)
      );
      if (calls.length === 0) {
        const answer = content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ answer: answer || "답을 만들지 못했습니다.", tools: used });
      }

      const results = await Promise.all(
        calls.map(async (c) => {
          used.push(c.name);
          try {
            const out = await RUNNERS.get(c.name)!(c.input as never);
            return { type: "tool_result" as const, tool_use_id: c.id, content: JSON.stringify(out) };
          } catch (e) {
            return {
              type: "tool_result" as const,
              tool_use_id: c.id,
              is_error: true,
              content: `도구 실행 실패: ${e instanceof Error ? e.message : "unknown"}`,
            };
          }
        })
      );

      messages.push({ role: "assistant", content }, { role: "user", content: results as unknown as Block[] });
    }

    return NextResponse.json({ answer: "질문이 복잡해서 정리하지 못했습니다. 조금 더 좁혀서 물어봐 주세요.", tools: used });
  } catch (e) {
    console.error("ask:", e);
    return NextResponse.json({ answer: "지금은 답할 수 없습니다. 잠시 뒤 다시 물어봐 주세요." }, { status: 200 });
  }
}
