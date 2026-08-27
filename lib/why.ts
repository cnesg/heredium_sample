import type { MarketArtist } from "./market";
import type { GalleryArtist } from "./galleryArtists";
import type { IntlArtist } from "./intlMarket";
import { formatKRW } from "./market";
import { formatIntl } from "./intlMarket";

/**
 * "이 작가가 왜 지금 여기 있는가"를 데이터에서 직접 설명한다.
 *
 * 원래는 Claude에게 요약을 시켰는데, 세 가지가 틀렸다.
 *   1. 작가 페이지를 열 때마다 과금된다 — 방문자 수에 비례하는 비용.
 *   2. 모델이 기사 제목을 읽고 문장을 지어내니, 순위 계산에 실제로 쓰인 근거와
 *      화면에 적힌 설명이 서로 다른 것이 될 수 있다.
 *   3. 근거를 검증할 수 없다. 여기 적힌 문장은 전부 우리가 센 수에서 나온다.
 *
 * 그래서 규칙으로 조립한다. 지어낼 여지가 없고, 공짜고, 순위 로직과 같은 숫자를 쓴다.
 */

export type Reason = {
  /** 한 줄 요약. 스토리 동그라미의 tooltip과 목록의 부제에 쓴다. */
  headline: string;
  /** 근거 문장들. 작가 페이지에 나열한다. */
  points: string[];
};

function daysAgo(dateStr: string, today: string): number {
  return Math.round(
    (Date.parse(today + "T00:00:00Z") - Date.parse(dateStr + "T00:00:00Z")) / 86400000
  );
}

function ago(dateStr: string, today: string): string {
  const d = daysAgo(dateStr, today);
  if (d <= 0) return "오늘";
  if (d === 1) return "어제";
  if (d < 14) return `${d}일 전`;
  if (d < 60) return `${Math.round(d / 7)}주 전`;
  if (d < 365) return `${Math.round(d / 30)}개월 전`;
  return `${(d / 365).toFixed(1)}년 전`;
}

function bandPhrase(band: number, baseline: number): string {
  const d = band - baseline;
  if (d >= 0.8) return "추정가 상단을 크게 넘겨";
  if (d >= 0.35) return "추정가 상단권에서";
  if (d >= 0.1) return "추정가 중간 위에서";
  if (d > -0.1) return "시장 평균 수준에서";
  if (d > -0.4) return "추정가 하단 쪽에서";
  return "추정가 하단 아래에서";
}

/** 연도별 중앙값 시계열에서 방향만 뽑는다. 배율은 표본이 얇아 과장되기 쉽다. */
function trendPhrase(series: { y: number; n: number; med: number }[]): string | null {
  if (series.length < 3) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const ratio = last.med / first.med;
  if (ratio >= 1.6) return `${first.y}년 이후 낙찰가 중앙값이 올라왔습니다`;
  if (ratio <= 0.625) return `${first.y}년 정점 이후 낙찰가 중앙값이 내려왔습니다`;
  return `${first.y}년 이후 낙찰가 중앙값은 큰 방향 없이 유지되고 있습니다`;
}

export function explainArtist(input: {
  today: string;
  gallery?: GalleryArtist | null;
  market?: MarketArtist | null;
  intl?: IntlArtist | null;
  mentions?: number;
  /** 국내 경매 전체의 band 중앙값. 비교 기준이라 반드시 넘겨야 한다. */
  domesticBaseline: number;
}): Reason {
  const { today, gallery, market, intl, mentions = 0, domesticBaseline } = input;
  const points: string[] = [];
  const headlines: string[] = [];

  if (gallery) {
    const where =
      gallery.galleries.length === 1
        ? gallery.galleries[0]
        : `${gallery.galleries[0]} 등 ${gallery.galleries.length}곳`;
    points.push(
      `${where}에서 ${gallery.n}건의 소식으로 다뤄졌고, 가장 최근은 ${ago(gallery.last, today)}입니다.`
    );
    headlines.push(
      gallery.galleries.length > 1
        ? `갤러리 ${gallery.galleries.length}곳 ${gallery.n}건`
        : `${gallery.galleries[0]} ${gallery.n}건`
    );
  }

  if (market && market.sold > 0) {
    const st = Math.round((market.sold / market.lots) * 100);
    const band = market.r24.band ?? market.band;

    if (market.r24.sold >= 2 && band !== null) {
      points.push(
        `국내 경매에서 최근 24개월 ${market.r24.sold}점이 ${bandPhrase(band, domesticBaseline)} 낙찰됐습니다.` +
          ` 누적 ${market.lots}점 출품에 낙찰률 ${st}%, 낙찰가 중앙값 ${formatKRW(market.medianHammer)}입니다.`
      );
      if (band - domesticBaseline >= 0.35) headlines.push("경매 강세");
    } else {
      points.push(
        `국내 경매 기록은 누적 ${market.lots}점, 낙찰률 ${st}%, 중앙값 ${formatKRW(market.medianHammer)}입니다.` +
          ` 최근 24개월 낙찰은 ${market.r24.sold}점으로 지금 활발하다고 보기는 어렵습니다.`
      );
    }

    const t = trendPhrase(market.series);
    if (t) points.push(t + ".");
  } else if (gallery) {
    points.push("국내 경매 기록은 없습니다 — 아직 2차 시장에 나오지 않았다는 뜻입니다.");
  }

  if (intl && intl.sold > 0) {
    points.push(
      `해외에서는 ${intl.houses.join(" · ")}에 ${intl.lots}점이 출품돼 ${intl.sold}점이 낙찰됐고,` +
        ` 중앙값은 ${formatIntl(intl.medianPrice, intl.currency)}입니다. 마지막 출품은 ${ago(intl.lastSale, today)}입니다.`
    );
    headlines.push(`해외 ${intl.sold}점`);
  }

  if (mentions > 0) {
    points.push(`최근 90일 뉴스·영상에서 ${mentions}건 언급됐습니다.`);
    headlines.push(`언급 ${mentions}건`);
  }

  if (points.length === 0) {
    return {
      headline: "수집된 자료 없음",
      points: [
        "추적 중인 갤러리 17곳의 소식에도, 국내외 경매 기록에도 아직 이 이름이 없습니다.",
      ],
    };
  }

  return { headline: headlines.slice(0, 2).join(" · "), points };
}
