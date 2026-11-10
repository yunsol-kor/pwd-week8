import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const authConfigured = Boolean(
  url &&
    key &&
    !url.includes("your-project-ref") &&
    !key.includes("replace_with"),
);
export const supabase = authConfigured
  ? createClient(url, key, {
      auth: {
        // [이론: 세션·보관] SDK session은 토큰·사용자 정보를 묶은 객체로, 세션 ID 문자열과 구분합니다.
        // persistSession은 새로고침 뒤 복원을 위해 이 상태를 브라우저 저장소에 보관합니다.
        // [이론: 갱신] autoRefreshToken은 만료 전에 새 토큰을 요청하며, 기존 JWT의 만료 시각을 연장하지 않습니다.
        persistSession: true,
        autoRefreshToken: true,
        // 전용 콜백 페이지는 이번 코드 교환의 결과를 직접 확인합니다.
        detectSessionInUrl: window.location.pathname !== "/auth/callback",
        flowType: "pkce",
      },
    })
  : null;
export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "클라이언트의 Supabase URL과 Publishable key를 설정하세요.",
    );
  return supabase;
}
