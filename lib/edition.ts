/** 매일 07:00 KST에 갱신되는 판(edition) 기준 시각을 다룬다. */

const KST_OFFSET_MIN = 9 * 60;
const CUTOFF_HOUR = 7;

/** 지금 보고 있는 판의 기준 시각(KST)을 Date로 돌려준다. */
export function currentEdition(now: Date = new Date()): Date {
  const kst = new Date(now.getTime() + (KST_OFFSET_MIN + now.getTimezoneOffset()) * 60000);
  const edition = new Date(kst);
  edition.setHours(CUTOFF_HOUR, 0, 0, 0);
  if (kst.getHours() < CUTOFF_HOUR) {
    edition.setDate(edition.getDate() - 1);
  }
  return edition;
}

/** "8월 14일 오전 7시 판" 같은 문자열. */
export function editionLabel(now: Date = new Date()): string {
  const e = currentEdition(now);
  return `${e.getMonth() + 1}월 ${e.getDate()}일 오전 7시 판`;
}

/**
 * KST 기준 오늘 날짜(YYYY-MM-DD). 서버는 UTC로 도는데 페어 일정과 경매 날짜는
 * 한국 시간 기준이라, UTC 자정 이후 9시간 동안 하루가 어긋난다.
 */
export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MIN * 60000).toISOString().slice(0, 10);
}
