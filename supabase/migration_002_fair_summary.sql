-- 아트 행사(페어) 카드에 쓸 요약 필드 추가.
-- exhibitions.source_url은 이미 있던 필드를 "예약 링크"로 재활용한다.
alter table exhibitions add column if not exists summary text;
