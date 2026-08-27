-- 작가 상세 페이지에서 "왜 화제인지" 요약을 만들려면 언급 당시의 원문
-- 제목이 필요하다. signals에는 지금까지 url만 있었고 텍스트가 없었다.
alter table signals add column if not exists headline text;
