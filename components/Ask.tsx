"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "bot"; text: string; tools?: string[] };

const SUGGESTS = [
  "아트바젤 언제 열려?",
  "지금 국내에서 열리는 전시 알려줘",
  "이우환 경매 기록 어때?",
  "요즘 국내 미술시장 분위기는?",
  "추정가를 넘겨 팔린 작가는 누구야?",
];

const TOOL_LABEL: Record<string, string> = {
  search_fairs: "페어 캘린더",
  lookup_artist: "작가 데이터",
  search_gallery_news: "갤러리 아카이브",
  market_overview: "경매 집계",
  list_sources: "수집 현황",
};

export default function Ask({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 서버가 돌려준 대화 이력. 도구 호출 블록까지 들어있어 화면용 turns와 다르다.
  const history = useRef<unknown[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    setTurns((t) => [...t, { role: "user", text: q }]);
    setText("");
    setBusy(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, history: history.current }),
      });
      const data = await res.json();
      if (Array.isArray(data.history)) history.current = data.history;
      setTurns((t) => [...t, { role: "bot", text: data.answer ?? "답을 받지 못했습니다.", tools: data.tools }]);
    } catch {
      setTurns((t) => [...t, { role: "bot", text: "연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="askBackdrop"
      role="dialog"
      aria-modal="true"
      aria-label="ARTREND에 물어보기"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="askPanel">
        <div className="askHead">
          <span className="askHeadTitle">물어보기</span>
          <span className="askHeadNote">수집한 데이터 + 웹 검색</span>
          <button type="button" className="askClose" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="askBody" ref={bodyRef}>
          {turns.length === 0 && (
            <div>
              <p className="askIntro">
                페어 일정, 작가의 경매 기록, 갤러리 전시 소식은 이 사이트가 모아둔 데이터에서
                바로 답합니다. 없는 건 웹에서 찾아 보완하고, 어디서 온 정보인지 밝힙니다.
              </p>
              <div className="askSuggests">
                {SUGGESTS.map((s) => (
                  <button key={s} type="button" className="askSuggest" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "askMsg askMsg--user" : "askMsg askMsg--bot"}>
              {t.text}
              {t.tools && t.tools.length > 0 && (
                <span className="askTools">
                  참조: {[...new Set(t.tools)].map((x) => TOOL_LABEL[x] ?? x).join(" · ")}
                </span>
              )}
            </div>
          ))}

          {busy && (
            <div className="askMsg askMsg--bot" aria-live="polite">
              <span className="skeleton" style={{ width: "42%" }} />
              <span className="skeleton" style={{ width: "68%" }} />
            </div>
          )}
        </div>

        <form
          className="askForm"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input
            ref={inputRef}
            className="askInput"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="아트바젤 언제 열려?"
            aria-label="질문"
            maxLength={500}
          />
          <button type="submit" className="askSend" disabled={busy || !text.trim()}>
            {busy ? "…" : "묻기"}
          </button>
        </form>
      </div>
    </div>
  );
}
