/**
 * 글로벌 미술시장 매크로 지표 — 정적 데이터 모듈 (/market 페이지용).
 *
 * 모든 수치는 아래 세 보고서 요약본에서 **그대로** 옮겼다. 계산·보간·반올림 변경을 하지 않는다.
 * 출처: knowledge/01_art_basel_ubs_2026.md, 03_artnet_midyear_2025.md,
 *       07_artprice_art_market_in_2025.md, 08_art_price_indices_and_asset_comparison.md
 *
 * 이 파일의 존재 이유는 "숫자를 모아두는 것"이 아니라 **집계 기준이 다른 숫자를 섞지 않는 것**이다.
 * Art Basel/UBS의 $59.6bn과 Artprice의 $11.11bn은 같은 대상을 세지 않는다 —
 * 화면에서 두 값을 나란히 놓을 때는 반드시 COMPARABILITY_NOTE를 함께 노출해야 한다.
 */

// ── 보고서(출처) ─────────────────────────────────────

export type ReportId =
  | "art-basel-ubs-2026"
  | "artnet-midyear-2025"
  | "artprice-2025"
  | "indices-2026";

export type Report = {
  id: ReportId;
  title: string;
  publisher: string;
  /** 데이터가 다루는 대상 연도(발행 연도가 아니다). */
  year: number;
  /** 무엇을 세는가. */
  scopeIncludes: string;
  /** 무엇을 빼는가 — 이게 비교 가능성을 결정한다. */
  scopeExcludes: string;
  /** 이 보고서 숫자를 어떻게 읽어야 하는지 한 줄. */
  howToRead: string;
};

export const REPORTS: Report[] = [
  {
    id: "art-basel-ubs-2026",
    title: "The Art Basel and UBS Art Market Report 2026",
    publisher: "Arts Economics (Dr. Clare McAndrew) / Art Basel · UBS",
    year: 2025,
    scopeIncludes:
      "딜러·갤러리(1차 시장)와 경매(공개 + 프라이빗)를 모두 합친 '글로벌 미술시장' 전체. 미술품과 골동품을 함께 센다.",
    scopeExcludes:
      "추정 기반 집계다 — 딜러 부문은 설문·모델 추정치이므로 경매처럼 거래 단위로 확인되는 수치가 아니다.",
    howToRead:
      "시장 '규모'를 말할 때 쓰는 유일한 숫자. 딜러 매출이 절반 이상을 차지하므로 경매 통계와 직접 비교하면 안 된다.",
  },
  {
    id: "artnet-midyear-2025",
    title: "Artnet Intelligence Report — Mid-Year Review 2025",
    publisher: "Artnet",
    year: 2025,
    scopeIncludes:
      "2025년 1월 1일–6월 30일 상반기 파인아트 경매 낙찰액(낙찰가 + 구매수수료), Artnet Price Database 기준.",
    scopeExcludes: "프라이빗 세일과 딜러/갤러리 거래는 제외.",
    howToRead:
      "연간 수치가 아니라 상반기만 본 단면이다. 2025년은 하반기에 몰린 해였으므로 이 숫자만으로 연간 흐름을 판단하면 안 된다.",
  },
  {
    id: "artprice-2025",
    title: "The Art Market in 2025",
    publisher: "Artprice by Artmarket.com · Artron.Net / ARAA",
    year: 2025,
    scopeIncludes:
      "2025년 1월 1일–12월 31일 전 세계 파인아트 공개 경매 낙찰액. 회화·조각·드로잉·사진·판화·영상·설치·태피스트리·NFT 포함.",
    scopeExcludes:
      "골동품, 작자미상 문화재, 가구를 제외하며 — 결정적으로 딜러/갤러리 1차 시장을 아예 다루지 않는다.",
    howToRead:
      "경매장에서 실제로 확인된 거래만 센 '바닥 다진' 숫자. 중국 데이터(Artron 자체 DB)가 서구 보고서보다 깊다.",
  },
  {
    id: "indices-2026",
    title: "Art Price Indices & Comparison to Traditional Assets",
    publisher: "내부 리서치 노트 (2026-08-19 작성)",
    year: 2026,
    scopeIncludes:
      "미술품 가격지수(반복매매지수 및 블루칩 포트폴리오 지수)와 주식·채권 대비 수익률 비교.",
    scopeExcludes: "시장 규모(거래총액) 데이터는 다루지 않는다.",
    howToRead:
      "'시장이 얼마나 컸나'가 아니라 '작품 값이 얼마나 올랐나'를 묻는 지표. 거래총액과 지수는 서로 다른 질문의 답이다.",
  },
];

// ── 헤드라인 지표 ─────────────────────────────────────

export type StatUnit = "USD_BN" | "USD_MN" | "PERCENT" | "PERCENT_POINT_SHARE";

export type HeadlineStat = {
  id: string;
  label: string;
  /** 파일에 적힌 그대로의 값. 가공하지 않는다. */
  value: number;
  unit: StatUnit;
  year: number;
  /** 상반기만 다루는 수치는 여기에 표시한다. */
  period?: "H1" | "FY";
  sourceId: ReportId;
  caveat?: string;
};

export const HEADLINE_STATS: HeadlineStat[] = [
  // 시장 규모 — 기준이 다른 두 총액
  {
    id: "global-market-size-2025",
    label: "글로벌 미술시장 규모 (딜러 + 경매)",
    value: 59.6,
    unit: "USD_BN",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "딜러/갤러리 1차 시장을 포함한 총액. 아래 경매 낙찰총액과 직접 비교 불가.",
  },
  {
    id: "global-market-yoy-2025",
    label: "글로벌 미술시장 전년 대비",
    value: 4,
    unit: "PERCENT",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "2년 연속 하락을 끝낸 반등이지만 여전히 2023년보다 9% 낮다.",
  },
  {
    id: "dealer-sales-2025",
    label: "딜러·갤러리 부문 매출",
    value: 34.8,
    unit: "USD_BN",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "전년 대비 +2%. Artprice 집계에는 이 부문이 통째로 빠져 있다.",
  },
  {
    id: "public-auction-sales-2025",
    label: "공개 경매 낙찰총액 (미술품 + 골동품)",
    value: 20.7,
    unit: "USD_BN",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "전년 대비 +9%. 골동품까지 포함한 넓은 정의라 Artprice의 파인아트 전용 수치보다 크다.",
  },
  {
    id: "artprice-fine-art-turnover-2025",
    label: "파인아트 경매 낙찰총액 (경매 한정)",
    value: 11.11,
    unit: "USD_BN",
    year: 2025,
    period: "FY",
    sourceId: "artprice-2025",
    caveat:
      "딜러 시장과 골동품·가구를 제외한 파인아트 공개 경매만의 수치. 3년 연속 하락(2022–2024 누적 -42.8%)을 끝낸 첫 반등이다.",
  },
  {
    id: "artprice-turnover-yoy-2025",
    label: "파인아트 경매 낙찰총액 전년 대비",
    value: 12,
    unit: "PERCENT",
    year: 2025,
    period: "FY",
    sourceId: "artprice-2025",
  },
  {
    id: "artnet-h1-turnover-2025",
    label: "상반기 파인아트 경매 낙찰액",
    value: 4.72,
    unit: "USD_BN",
    year: 2025,
    period: "H1",
    sourceId: "artnet-midyear-2025",
    caveat: "전년 동기 대비 -8.8%, 2022년 상반기 정점 대비 -40.9%. 반기 단면이라는 점에 유의.",
  },

  // 지역 점유율 — 시장 전체 기준(Art Basel/UBS)
  {
    id: "share-us-2025",
    label: "미국 점유율 (시장 전체 기준)",
    value: 44,
    unit: "PERCENT_POINT_SHARE",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "$26.0bn, +5%. 1위 유지.",
  },
  {
    id: "share-uk-2025",
    label: "영국 점유율 (시장 전체 기준)",
    value: 18,
    unit: "PERCENT_POINT_SHARE",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "$10.5bn, +2%.",
  },
  {
    id: "share-cn-2025",
    label: "중국 점유율 (시장 전체 기준)",
    value: 14,
    unit: "PERCENT_POINT_SHARE",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "$8.5bn, 점유율 -1%p.",
  },
  {
    id: "share-fr-2025",
    label: "프랑스 점유율 (시장 전체 기준)",
    value: 8,
    unit: "PERCENT_POINT_SHARE",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "$4.5bn, +9%. EU 최대 시장.",
  },
  {
    id: "big-three-share-2025",
    label: "미국·영국·중국 합산 점유율",
    value: 76,
    unit: "PERCENT_POINT_SHARE",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat: "10년 만의 최저치 — 시장이 조금씩 분산되고 있다는 신호.",
  },

  // 가격대 분화 — 파일 03의 상반기 역전 현상
  {
    id: "segment-10m-plus-h1-2025",
    label: "$10M 초과 구간 (상반기)",
    value: -43.4,
    unit: "PERCENT",
    year: 2025,
    period: "H1",
    sourceId: "artnet-midyear-2025",
    caveat: "$515.4m로 급감. 10년 내 최소인 27개 로트만 이 구간에서 팔렸다.",
  },
  {
    id: "segment-1m-10m-h1-2025",
    label: "$1M–$10M 구간 (상반기)",
    value: 13.8,
    unit: "PERCENT",
    year: 2025,
    period: "H1",
    sourceId: "artnet-midyear-2025",
    caveat: "$1.6bn. 상반기에 성장한 유일한 가격 구간 — 초고가와 정반대로 움직였다.",
  },
  {
    id: "segment-10m-plus-fy-2025",
    label: "$10M 초과 구간 (연간)",
    value: 30,
    unit: "PERCENT",
    year: 2025,
    period: "FY",
    sourceId: "art-basel-ubs-2026",
    caveat:
      "상반기의 -43.4%와 모순처럼 보이지만 기간이 다르다 — 11월 뉴욕 대형 컬렉션 세일이 하반기에 몰리며 연간으로는 최고 성장 구간이 됐다.",
  },
];

// ── 가격대별 성과 ─────────────────────────────────────

export type Segment = {
  id: string;
  /** 가격 구간 표기 — 원문 표기를 유지한다. */
  band: string;
  label: string;
  year: number;
  period: "H1" | "FY";
  /** 낙찰액 증감률(%). 파일에 없으면 null. */
  valueChangePct: number | null;
  /** 해당 구간 낙찰액. 파일에 없으면 null. */
  valueUsdMn?: number | null;
  sourceId: ReportId;
  note?: string;
};

export const SEGMENTS: Segment[] = [
  // 상반기(Artnet) — 초고가만 무너지고 그 아래 한 칸이 버틴 구조
  { id: "h1-over-10m", band: "$10M 초과", label: "초고가", year: 2025, period: "H1", valueChangePct: -43.4, valueUsdMn: 515.4, sourceId: "artnet-midyear-2025", note: "2022년 정점 대비 -81.2%. 27개 로트로 10년 내 최소." },
  { id: "h1-1m-10m", band: "$1M–$10M", label: "상위 중간대", year: 2025, period: "H1", valueChangePct: 13.8, valueUsdMn: 1600, sourceId: "artnet-midyear-2025", note: "상반기에 성장한 유일한 구간. 로트 수도 약 +6.7%." },
  { id: "h1-100k-1m", band: "$100K–$1M", label: "중간대", year: 2025, period: "H1", valueChangePct: -8, valueUsdMn: null, sourceId: "artnet-midyear-2025", note: "로트 수 -9%." },
  { id: "h1-10k-100k", band: "$10K–$100K", label: "중저가", year: 2025, period: "H1", valueChangePct: -10.1, valueUsdMn: null, sourceId: "artnet-midyear-2025" },
  { id: "h1-under-10k", band: "$10K 미만", label: "저가", year: 2025, period: "H1", valueChangePct: -9.8, valueUsdMn: null, sourceId: "artnet-midyear-2025", note: "이전까지 가장 견고했던 구간이 무너진 것 — 약세가 넓어졌다는 신호." },

  // 연간(Art Basel/UBS) — 하반기 대형 세일로 상반기 그림이 뒤집힌다
  { id: "fy-over-10m", band: "$10M 초과", label: "초고가", year: 2025, period: "FY", valueChangePct: 30, valueUsdMn: null, sourceId: "art-basel-ubs-2026", note: "낙찰 로트 수 +9%. 연간 기준 최고 성과 구간." },
  { id: "fy-over-1m", band: "$1M 초과", label: "고가", year: 2025, period: "FY", valueChangePct: 21, valueUsdMn: null, sourceId: "art-basel-ubs-2026", note: "거래 건수 +15%. 그래도 2019년 수준에는 못 미친다." },
  { id: "fy-under-50k", band: "$50,000 미만", label: "저가", year: 2025, period: "FY", valueChangePct: -2, valueUsdMn: null, sourceId: "art-basel-ubs-2026", note: "금액·수량 모두 -2%. 연간 기준 유일하게 감소한 광의 구간." },
];

/** 낙찰액 중 각 구간이 차지하는 비중 (연간, Art Basel/UBS). */
export type SegmentValueShare = {
  band: string;
  sharePct: number;
  year: number;
  sourceId: ReportId;
  note?: string;
};

export const SEGMENT_VALUE_SHARES: SegmentValueShare[] = [
  { band: "$1M 초과", sharePct: 54, year: 2025, sourceId: "art-basel-ubs-2026", note: "거래 건수로는 1% 미만인데 금액의 절반 이상. 전년 대비 +5%p." },
  { band: "$1M–$10M", sharePct: 32, year: 2025, sourceId: "art-basel-ubs-2026", note: "단일 구간 중 최대. +2%p." },
  { band: "$10M 초과", sharePct: 22, year: 2025, sourceId: "art-basel-ubs-2026", note: "+4%p. 2022년의 3분의 1 수준에는 아직 못 미친다." },
];

// ── 지역별 ───────────────────────────────────────────

export type Region = {
  id: string;
  country: string;
  countryKo: string;
  year: number;
  period: "H1" | "FY";
  /** 해당 집계 기준에서의 낙찰액/매출 (백만 USD). */
  valueUsdMn: number;
  /** 전체 대비 점유율(%). 파일에 없으면 null. */
  sharePct: number | null;
  yoyPct: number | null;
  /** 어떤 기준으로 센 값인지 — 섞으면 안 되므로 명시한다. */
  basis: "total-market" | "fine-art-auction";
  sourceId: ReportId;
  note?: string;
};

export const REGIONS: Region[] = [
  // 시장 전체 기준 (딜러 포함)
  { id: "abubs-us", country: "United States", countryKo: "미국", year: 2025, period: "FY", valueUsdMn: 26000, sharePct: 44, yoyPct: 5, basis: "total-market", sourceId: "art-basel-ubs-2026", note: "2022년 정점($30.2bn)과 2019년($28.1bn)에는 아직 못 미친다." },
  { id: "abubs-uk", country: "United Kingdom", countryKo: "영국", year: 2025, period: "FY", valueUsdMn: 10500, sharePct: 18, yoyPct: 2, basis: "total-market", sourceId: "art-basel-ubs-2026", note: "2024년 되찾은 2위를 유지. 여전히 2019년 아래." },
  { id: "abubs-cn", country: "China", countryKo: "중국", year: 2025, period: "FY", valueUsdMn: 8500, sharePct: 14, yoyPct: null, basis: "total-market", sourceId: "art-basel-ubs-2026", note: "사실상 보합(약 +1%). 본토는 성장, 홍콩은 -5%." },
  { id: "abubs-fr", country: "France", countryKo: "프랑스", year: 2025, period: "FY", valueUsdMn: 4500, sharePct: 8, yoyPct: 9, basis: "total-market", sourceId: "art-basel-ubs-2026", note: "세계 4위, EU 최대." },

  // 파인아트 경매 기준 (Artprice, 연간)
  { id: "artprice-us", country: "United States", countryKo: "미국", year: 2025, period: "FY", valueUsdMn: 4700, sharePct: 42.3, yoyPct: 22, basis: "fine-art-auction", sourceId: "artprice-2025", note: "미국+영국이 세계 낙찰액의 55.7%. 성장은 물량이 아니라 대작에서 나왔다(로트 수 -2%)." },
  { id: "artprice-cn", country: "China", countryKo: "중국", year: 2025, period: "FY", valueUsdMn: 1760, sharePct: 15.8, yoyPct: -5, basis: "fine-art-auction", sourceId: "artprice-2025", note: "Artron 자체 DB 기준. 금액은 줄고 물량은 느는 재편 국면." },
  { id: "artprice-uk", country: "United Kingdom", countryKo: "영국", year: 2025, period: "FY", valueUsdMn: 1500, sharePct: null, yoyPct: 3, basis: "fine-art-auction", sourceId: "artprice-2025", note: "보고서 내에서도 $1.5bn / $1.49bn / $1.396bn으로 표기가 갈린다. 10년 전의 절반에 못 미친다." },
  { id: "artprice-fr", country: "France", countryKo: "프랑스", year: 2025, period: "FY", valueUsdMn: 945.4, sharePct: null, yoyPct: 26, basis: "fine-art-auction", sourceId: "artprice-2025", note: "역대 3번째로 좋은 해. 파리는 낙찰 로트 수 기준 세계 1위 도시." },
  { id: "artprice-kr", country: "South Korea", countryKo: "한국", year: 2025, period: "FY", valueUsdMn: 99.4, sharePct: null, yoyPct: 41, basis: "fine-art-auction", sourceId: "artprice-2025", note: "서울 기준. 김환기·이우환·박수근·이중섭 수요가 견인." },

  // 파인아트 경매 기준 (Artnet, 상반기)
  { id: "artnet-us", country: "United States", countryKo: "미국", year: 2025, period: "H1", valueUsdMn: 2200, sharePct: null, yoyPct: -0.9, basis: "fine-art-auction", sourceId: "artnet-midyear-2025", note: "주요 시장 중 낙폭이 가장 작았다." },
  { id: "artnet-cn", country: "China", countryKo: "중국", year: 2025, period: "H1", valueUsdMn: 666.1, sharePct: null, yoyPct: -26, basis: "fine-art-auction", sourceId: "artnet-midyear-2025", note: "10년 내 두 번째로 낮은 상반기." },
  { id: "artnet-uk", country: "United Kingdom", countryKo: "영국", year: 2025, period: "H1", valueUsdMn: 630.4, sharePct: null, yoyPct: -24.5, basis: "fine-art-auction", sourceId: "artnet-midyear-2025", note: "2년 연속 약 -25% — 2년 만에 반토막." },
  { id: "artnet-fr", country: "France", countryKo: "프랑스", year: 2025, period: "H1", valueUsdMn: 363.9, sharePct: null, yoyPct: 4.7, basis: "fine-art-auction", sourceId: "artnet-midyear-2025", note: "상반기에 성장한 유일한 주요 시장." },
];

// ── 가격지수 ─────────────────────────────────────────

export type IndexMethod = "repeat-sales" | "portfolio" | "price-only";

export type PriceIndex = {
  id: string;
  name: string;
  provider: string;
  method: IndexMethod;
  /** 무엇을 측정하는가. */
  measures: string;
  /** 무료로 볼 수 있는 실시간/정기 공개 시계열이 있는가. */
  freeLiveFeed: boolean;
  access: string;
  /** 이 지수를 믿을 때의 한계. */
  limits: string;
  sourceId: ReportId;
  /** 파일에 명시된 수치만 담는다. 없으면 생략. */
  figures?: { label: string; value: string }[];
};

export const INDICES: PriceIndex[] = [
  {
    id: "mei-moses",
    name: "Mei Moses Fine Art Index",
    provider: "Jianping Mei & Michael Moses (2016년 Sotheby's 인수)",
    method: "repeat-sales",
    measures:
      "같은 작품이 두 번 이상 경매에 나왔을 때의 가격 쌍을 비교해, 작가 명성·크기·재료를 통제한 순수 가치 변화만 뽑아낸다. 부동산의 Case-Shiller와 같은 방식.",
    freeLiveFeed: false,
    access:
      "2016년 Sotheby's가 인수한 뒤 사내 전용. 조회 가능한 공개 지수가 없다 — 현재 지수 레벨은 확인할 수 없다.",
    limits:
      "인용 가능한 수치는 2002년 원 논문의 과거 데이터뿐이다. 결국 재판매된 작품만 표본에 들어가는 생존 편향이 있어 평균 수익률은 '상한선'으로 읽어야 한다.",
    sourceId: "indices-2026",
    figures: [
      { label: "실질 연복리 수익률 (1950–1999, 미술)", value: "8.2%" },
      { label: "같은 기간 S&P 500", value: "8.9%" },
      { label: "같은 기간 다우", value: "9.1%" },
      { label: "같은 기간 회사채 / 국채", value: "2.2% / 1.9%" },
      { label: "변동성 (1950–1999)", value: "21.3%" },
      { label: "S&P 500 대비 베타", value: "0.718" },
      { label: "1990년 정점 이후 1991년 하락률", value: "-36%" },
    ],
  },
  {
    id: "mab100",
    name: "MAB100",
    provider: "MyArtBroker",
    method: "repeat-sales",
    measures:
      "블루칩 작가의 판화·에디션에 한정한 반복매매지수. 같은 판화가 두 번 팔린 쌍을 하나의 가격 쌍으로 쓴다.",
    freeLiveFeed: true,
    access:
      "myartbroker.com/mab-100 에서 로그인 없이 실시간 지수와 차트를 볼 수 있다. 현재 무료로 접근 가능한 진짜 반복매매지수 중 최선.",
    limits:
      "판화·에디션 전용이다 — 회화·조각 시장 전반으로 일반화할 수 없다. 동일 가중이며 360일 이동평균으로 평활되고 분기마다 재조정, 컨디션은 최상으로 가정한다.",
    sourceId: "indices-2026",
    figures: [
      { label: "관측 지수 레벨 (2026-08-19)", value: "99.86 포인트" },
      { label: "데이터 출처 경매사 수", value: "300+" },
    ],
  },
  {
    id: "artprice100",
    name: "Artprice100®",
    provider: "Artprice / Artmarket.com",
    method: "portfolio",
    measures:
      "최근 5년 낙찰총액 상위 100인 작가(연 10건 이상 유동성 조건)로 구성한 가상 포트폴리오의 가치. 매년 재구성한다.",
    freeLiveFeed: true,
    access: "news.artprice.com 기사로 무료 공개. 보통 연말·1월경 발표된다.",
    limits:
      "반복매매지수가 아니다 — 작품 단위 품질을 통제하지 않으므로 시가총액 가중 주가지수에 가깝다. S&P 500과의 상관이 매우 높아, 이 지수를 근거로 '미술은 저상관 분산자산'이라고 말하면 안 된다. 구성도 점점 동시대 미술 쪽으로 기운다.",
    sourceId: "indices-2026",
    figures: [
      { label: "2025년 수익률", value: "+11.2% (같은 해 S&P 500 +17%)" },
      { label: "2024년 수익률", value: "-8.3% (같은 해 S&P 500 +24%)" },
      { label: "S&P 500 상관계수", value: "R=0.88 (2000–2026) / R=0.91 (2010–2026)" },
      { label: "전후·동시대 미술 비중 (2025년 1월)", value: "45% (5년 전 40%)" },
      { label: "2025년 구성종목 예시", value: "Basquiat +18%, Picasso +6%, Nicolas Party -6%, Kusama -15%" },
    ],
  },
  {
    id: "amr",
    name: "Art Market Research (AMR)",
    provider: "artmarketresearch.com",
    method: "price-only",
    measures:
      "작가·부문별 낙찰가의 중위값/대표값 추이. 반복매매 방식을 명시적으로 쓰지 않으며, 가격 쌍이 부족해 놓치는 부분을 대신 본다는 입장이다.",
    freeLiveFeed: false,
    access:
      "대부분 유료. 홈페이지에 작가 간 비교용 무료 인터랙티브 위젯이 있지만 원계열 수치는 구독 없이 받을 수 없다. 단건 리포트 £195부터 무제한 연 £12,000까지.",
    limits:
      "1978년부터 이어진 권위 있는 계열이고 Knight Frank·Credit Suisse·FT 등이 인용하지만, 무료로 수치를 끌어올 수 없어 정성적 인용에 그친다.",
    sourceId: "indices-2026",
  },
];

/** 지수와 별개로 자주 인용되는 위험/수익 벤치마크. 2차 출처이므로 그렇게 표시한다. */
export type SecondaryBenchmark = {
  id: string;
  label: string;
  value: string;
  sourceId: ReportId;
  caveat: string;
};

export const SECONDARY_BENCHMARKS: SecondaryBenchmark[] = [
  {
    id: "broad-fine-art-return",
    label: "광의 파인아트 명목 연수익률 / 샤프지수",
    value: "약 6.3% / 약 0.11",
    sourceId: "indices-2026",
    caveat: "2차 출처를 모은 '통상 인용되는' 값이다. 반복매매 선택편향을 보정하면 주식보다 위험조정 성과가 낮다.",
  },
  {
    id: "contemporary-sharpe",
    label: "동시대 미술 샤프지수 (1998–2023)",
    value: "약 0.41 (같은 기간 S&P 500 0.56)",
    sourceId: "indices-2026",
    caveat: "미술 하위 부문 중에서는 가장 경쟁력 있지만 여전히 주식에 못 미친다. 2차 출처.",
  },
  {
    id: "allocation-guidance",
    label: "자산배분 통상 가이드",
    value: "투자자산의 1–3%, 최소 7–10년 보유",
    sourceId: "indices-2026",
    caveat: "웰스 어드바이저리 업계의 일반 권고. 손실 감내 가능한 자금으로 한정하라는 전제가 붙는다.",
  },
  {
    id: "recovery-time",
    label: "하락 이후 평균 회복 기간",
    value: "약 4.5년",
    sourceId: "indices-2026",
    caveat: "여러 2차 출처에서 널리 인용되나 하나의 원 연구로 추적되지는 않았다.",
  },
];

// ── 비교 가능성 경고 ─────────────────────────────────

/**
 * 두 헤드라인 총액을 화면에 함께 띄울 때 반드시 같이 노출한다.
 * 각주가 아니라 본문 취급 — 이 문장이 빠지면 데이터가 틀린 것과 같은 효과를 낸다.
 */
export const COMPARABILITY_NOTE =
  "Art Basel/UBS의 $59.6bn과 Artprice의 $11.11bn은 같은 것을 세지 않는다. 앞의 숫자는 딜러·갤러리 1차 시장($34.8bn)까지 포함한 미술품·골동품 시장 전체의 추정 규모이고, 뒤의 숫자는 파인아트 공개 경매에서 실제로 낙찰된 금액만 집계한 값으로 딜러 시장을 아예 다루지 않으며 골동품·작자미상 문화재·가구도 제외한다. 경매만 놓고 비교하더라도 Art Basel/UBS의 공개 경매 수치는 $20.7bn으로, 골동품까지 포함하는 더 넓은 정의와 경매사·지역 커버리지 차이 때문에 Artprice의 $11.11bn과 여전히 어긋난다. 두 수치를 빼거나 나누어 증감률·점유율을 만들면 안 되며, 반드시 각자의 집계 기준 안에서만 읽어야 한다.";

// ── 조회 도우미 ──────────────────────────────────────

export function getReport(id: ReportId): Report | undefined {
  return REPORTS.find((r) => r.id === id);
}

/** 집계 기준이 다른 행을 한 표에 섞지 않기 위한 필터. */
export function regionsByBasis(basis: Region["basis"], period: Region["period"] = "FY"): Region[] {
  return REGIONS.filter((r) => r.basis === basis && r.period === period);
}

export function segmentsByPeriod(period: Segment["period"]): Segment[] {
  return SEGMENTS.filter((s) => s.period === period);
}
