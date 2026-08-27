"use client";

import { useEffect, useState } from "react";
import { supabaseAnon } from "@/lib/supabase";

type Venue = { id: string; name: string; city: string | null; country: string | null };
type RecentRow = {
  id: string;
  title: string;
  starts_on: string | null;
  ends_on: string | null;
  venues: { name: string } | null;
  exhibition_artists: { artists: { name_ko: string | null } }[];
};

const EXHIBIT_TYPES = [
  { value: "solo", label: "개인전" },
  { value: "group", label: "그룹전" },
  { value: "biennale", label: "비엔날레 / 행사" },
  { value: "fair", label: "페어 / 행사" },
  { value: "graduation", label: "졸업전시" },
];

const IS_EVENT_TYPE = (t: string) => t === "fair" || t === "biennale";

export default function AdminExhibitions() {
  const [adminKey, setAdminKey] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    artistNameKo: "",
    artistNameEn: "",
    nationality: "KR",
    exhibitionTitle: "",
    venueId: "",
    startsOn: "",
    endsOn: "",
    exhibitType: "solo",
    summary: "",
    bookingUrl: "",
  });

  const isEvent = IS_EVENT_TYPE(form.exhibitType);

  useEffect(() => {
    const saved = window.localStorage.getItem("artrend_admin_key");
    if (saved) setAdminKey(saved);

    const client = supabaseAnon();
    if (!client) return;

    client
      .from("venues")
      .select("id,name,city,country")
      .order("name")
      .then(({ data }) => setVenues(data ?? []));

    loadRecent(client);
  }, []);

  async function loadRecent(client: NonNullable<ReturnType<typeof supabaseAnon>>) {
    const { data } = await client
      .from("exhibitions")
      .select(
        "id,title,starts_on,ends_on,venues(name),exhibition_artists(artists(name_ko))"
      )
      .order("created_at", { ascending: false })
      .limit(8);
    setRecent((data as unknown as RecentRow[]) ?? []);
  }

  function saveKey(v: string) {
    setAdminKey(v);
    window.localStorage.setItem("artrend_admin_key", v);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/exhibitions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminKey, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");

      setStatus("ok");
      setForm((f) => ({
        ...f,
        artistNameKo: "",
        artistNameEn: "",
        exhibitionTitle: "",
        startsOn: "",
        endsOn: "",
        summary: "",
        bookingUrl: "",
      }));
      const client = supabaseAnon();
      if (client) loadRecent(client);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <main className="adminShell">
      <h1 className="adminTitle">전시 · 행사 입력</h1>
      <p className="adminNote">
        유형을 "페어/행사"나 "비엔날레/행사"로 두면 작가명 없이 행사 자체만
        저장된다 — 프리즈·아트바젤처럼 특정 작가 하나에 묶이지 않는 경우다.
        그 외 유형은 작가명을 넣으면 자동으로 연결된다.
      </p>

      <label className="adminField">
        <span>관리자 키</span>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => saveKey(e.target.value)}
          placeholder="ADMIN_SECRET 값"
        />
      </label>

      <form onSubmit={submit} className="adminForm">
        <label className="adminField">
          <span>유형</span>
          <select {...field("exhibitType")}>
            {EXHIBIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {!isEvent && (
          <div className="adminGrid">
            <label className="adminField">
              <span>작가명 (국문)</span>
              <input {...field("artistNameKo")} placeholder="예: 김민정" />
            </label>
            <label className="adminField">
              <span>작가명 (영문)</span>
              <input {...field("artistNameEn")} placeholder="예: Kim Minjung" />
            </label>
            <label className="adminField">
              <span>국적</span>
              <select {...field("nationality")}>
                <option value="KR">한국</option>
                <option value="US">미국</option>
                <option value="GB">영국</option>
                <option value="FR">프랑스</option>
                <option value="DE">독일</option>
                <option value="JP">일본</option>
                <option value="CN">중국</option>
                <option value="">기타/모름</option>
              </select>
            </label>
          </div>
        )}

        <label className="adminField">
          <span>제목 *</span>
          <input
            {...field("exhibitionTitle")}
            required
            placeholder={isEvent ? "예: Frieze Seoul 2026" : "예: 어떤 풍경"}
          />
        </label>

        <label className="adminField">
          <span>장소 *</span>
          <select {...field("venueId")} required>
            <option value="">선택</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.city ? ` · ${v.city}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="adminGrid">
          <label className="adminField">
            <span>시작일</span>
            <input type="date" {...field("startsOn")} />
          </label>
          <label className="adminField">
            <span>종료일</span>
            <input type="date" {...field("endsOn")} />
          </label>
        </div>

        {isEvent && (
          <>
            <label className="adminField">
              <span>요약 (카드 펼쳤을 때 보일 설명)</span>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="예: 아시아 최대 아트페어. 국내외 갤러리 200여 곳 참가."
                rows={3}
              />
            </label>
            <label className="adminField">
              <span>예약 링크 (URL)</span>
              <input
                {...field("bookingUrl")}
                placeholder="https://www.frieze.com/fairs/frieze-seoul/tickets"
              />
            </label>
          </>
        )}

        <button type="submit" disabled={status === "saving"} className="adminSubmit">
          {status === "saving" ? "저장 중…" : "저장"}
        </button>

        {status === "ok" && <p className="adminOk">저장됐습니다.</p>}
        {status === "error" && <p className="adminError">{errorMsg}</p>}
      </form>

      <h2 className="adminSubtitle">최근 입력</h2>
      <ul className="adminRecent">
        {recent.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong>
            <span>
              {r.exhibition_artists.map((ea) => ea.artists?.name_ko).filter(Boolean).join(", ")}
              {r.venues?.name ? ` · ${r.venues.name}` : ""}
              {r.starts_on ? ` · ${r.starts_on}` : ""}
            </span>
          </li>
        ))}
        {recent.length === 0 && <li className="adminEmpty">아직 입력된 항목이 없습니다.</li>}
      </ul>
    </main>
  );
}
