-- 같은 기사에서 나온 같은 작가 언급이 매일 다시 쌓이는 것을 막는다.
--
-- RSS 피드와 갤러리 아카이브는 한 항목을 며칠씩 계속 노출하기 때문에, 크론이 돌 때마다
-- 같은 기사가 다시 추출되어 signals에 새 행이 하나씩 더 생겼다. 그러면 트렌딩 순위가
-- "오래 걸려 있던 기사"를 "많이 언급된 작가"로 착각한다.
--
-- url이 없는 신호(수동 입력 등)는 이 제약에서 빠진다 — 그런 행은 중복이 아니라
-- 서로 다른 사실일 수 있다.

create unique index if not exists signals_dedupe_idx
  on signals (artist_id, axis, url)
  where url is not null;
