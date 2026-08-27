import Link from "next/link";
import { newsSources, newsConfigured } from "@/lib/newsSheet";
import { CHANNELS } from "@/lib/youtube";
import { GALLERIES } from "@/lib/galleries";
import { GALLERY_ARTISTS } from "@/lib/galleryArtists";
import { MARKET_META } from "@/lib/market";
import { FAIRS } from "@/lib/fairs";
import { REPORTS } from "@/lib/marketReports";

export const metadata = { title: "수집 소스 — ARTREND" };
export const revalidate = 3600;

export default async function SourcesPage() {
  // 뉴스 매체는 목록을 코드에 두지 않는다 — 실제로 시트에 들어온 매체를 세어
  // 보여주므로, Apps Script 쪽에서 피드를 추가·제거하면 여기가 저절로 따라온다.
  const [newsKr, newsIntl] = await Promise.all([
    newsSources("kr").catch(() => []),
    newsSources("intl").catch(() => []),
  ]);
  const ytKr = CHANNELS.filter((c) => c.scope === "kr");
  const ytIntl = CHANNELS.filter((c) => c.scope === "intl");
  const galKr = GALLERIES.filter((g) => g.scope === "kr");
  const galIntl = GALLERIES.filter((g) => g.scope === "intl");

  return (
    <main className="shell">
      <h1 className="pageTitle">수집 소스</h1>
      <p className="pageIntro">
        이 사이트에 나오는 것은 전부 아래에서만 옵니다. 무엇을 세고 무엇을 안 세는지
        분명히 해 두려고 목록을 통째로 공개합니다.
      </p>

      <section className="sourcesSection" style={{ marginTop: 30 }}>
        <h2>갤러리 아카이브 — 국내 {galKr.length}곳</h2>
        <ul className="sourcesList">
          {galKr.map((g) => (
            <li key={g.tab}>
              <a href={g.site} target="_blank" rel="noopener noreferrer">
                {g.name}
              </a>
              <span className="sourceTag">{g.city}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sourcesSection">
        <h2>갤러리 아카이브 — 해외 {galIntl.length}곳</h2>
        <ul className="sourcesList">
          {galIntl.map((g) => (
            <li key={g.tab}>
              <a href={g.site} target="_blank" rel="noopener noreferrer">
                {g.name}
              </a>
              <span className="sourceTag">{g.city}</span>
            </li>
          ))}
        </ul>
        <p className="statNote" style={{ marginTop: 10 }}>
          각 갤러리 공식 페이지를 매일 크롤링해 한국어 제목·키워드·요약을 붙여 쌓습니다.
          여기서 작가 {GALLERY_ARTISTS.length}명을 추려 트렌딩과 스토리에 씁니다.
          제목·요약·링크만 옮기며 본문은 재게시하지 않습니다.
        </p>
      </section>

      <section className="sourcesSection">
        <h2>경매</h2>
        <ul className="sourcesList">
          {MARKET_META.houses.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <p className="statNote" style={{ marginTop: 10 }}>
          각 사가 공개하는 경매 결과 API에서 {MARKET_META.lotCount.toLocaleString("ko-KR")}개
          롯을 모아({MARKET_META.coverage[0]} ~ {MARKET_META.coverage[1]}) 작가{" "}
          {MARKET_META.artistCount.toLocaleString("ko-KR")}명분으로 집계했습니다. 화면에는
          집계 통계와 작가별 최근 결과 몇 건만 싣고, 낙찰 기록 전체를 옮기지는 않습니다.
          서울옥션이 같은 도록에 올리는 명품·시계·주얼리 롯은 작가 데이터가 아니므로
          집계에서 제외했습니다. 해외는 본햄스·크리스티·소더비의 파인아트 롯을 따로
          집계합니다 — 통화가 일곱 가지라 금액은 합산하지 않고, 크리스티는 수수료
          포함가라 해머가와 섞지 않습니다.
        </p>
      </section>

      <section className="sourcesSection">
        <h2>뉴스 · 국내 {newsKr.length}곳 · 해외 {newsIntl.length}곳</h2>
        {newsConfigured() ? (
          <>
            <ul className="sourcesList">
              {[...newsKr, ...newsIntl].map((f) => (
                <li key={f.source}>
                  {f.source}
                  <span className="sourceTag">{f.count}건</span>
                </li>
              ))}
            </ul>
            <p className="statNote" style={{ marginTop: 10 }}>
              구글 시트에 붙인 스크립트가 6시간마다 RSS를 모아 한국어로 번역해 쌓고,
              사이트는 그 시트만 읽습니다. 위 목록은 코드에 적힌 것이 아니라 실제로
              시트에 들어온 매체를 센 것이라, 피드를 늘리면 여기도 따라 늘어납니다.
              제목·요약·링크만 옮기며 본문은 재게시하지 않습니다.
            </p>
          </>
        ) : (
          <p className="statNote">뉴스 시트가 아직 연결되지 않았습니다.</p>
        )}
      </section>

      <section className="sourcesSection">
        <h2>YouTube · 국내 {ytKr.length} · 해외 {ytIntl.length}</h2>
        <ul className="sourcesList">
          {[...ytKr, ...ytIntl].map((c) => (
            <li key={c.id}>
              <a
                href={`https://www.youtube.com/channel/${c.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="sourcesSection">
        <h2>페어 캘린더 {FAIRS.length}건</h2>
        <p className="statNote">
          2026년 8월 조사 기준으로 정리했습니다. 아직 일정을 발표하지 않은 행사는 날짜를
          추정하지 않고 &lsquo;미정&rsquo;으로 둡니다. 페어 일정은 바뀌므로 방문 전 공식
          페이지 확인이 필요합니다.
        </p>
      </section>

      <section className="sourcesSection">
        <h2>시장 보고서</h2>
        <ul className="sourcesList" style={{ gridTemplateColumns: "1fr" }}>
          {REPORTS.map((r) => (
            <li key={r.id} style={{ display: "block" }}>
              <strong style={{ fontWeight: 600 }}>{r.title}</strong>
              <span className="statNote">
                {r.publisher} · {r.year}년 데이터
              </span>
            </li>
          ))}
        </ul>
        <p className="statNote" style={{ marginTop: 10 }}>
          집계 기준이 서로 달라 총액을 직접 비교할 수 없습니다. 자세한 설명은{" "}
          <Link href="/market" style={{ textDecoration: "underline" }}>
            시장 페이지
          </Link>
          에 있습니다.
        </p>
      </section>

      <footer className="footer">
        추가하고 싶은 매체·채널·갤러리가 있으면 이름이나 URL을 알려주면 확인 후 이 목록에
        반영합니다. 뉴스는 6시간마다, 갤러리 아카이브는 한 시간마다, 영상은 매일 오전
        7시에 갱신됩니다. 경매 인덱스는 새로 집계해 배포할 때 바뀝니다.
        <br />
        <Link href="/">← 트렌드로</Link>
      </footer>
    </main>
  );
}
