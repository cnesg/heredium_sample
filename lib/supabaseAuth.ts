import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 로그인 세션을 쿠키로 읽고 쓰는 서버용 클라이언트.
 * lib/supabase.ts의 supabaseAnon/supabaseService와 다르다 — 그쪽은 세션 없이
 * 데이터만 읽고 쓰고, 이쪽은 "누가 로그인했는가"만 다룬다.
 *
 * 서버 컴포넌트·라우트 핸들러에서만 쓴다.
 */
export async function supabaseAuthServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        // 서버 컴포넌트에서는 쿠키를 쓸 수 없어 예외가 난다. 세션 갱신은
        // 미들웨어가 맡으므로 여기서는 조용히 넘어간다.
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}
