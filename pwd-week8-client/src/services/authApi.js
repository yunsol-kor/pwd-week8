import api, { publicApi } from "./api";
import { requireSupabase } from "../config/supabase";
export const authAPIService = {
  getProviders: async () => (await publicApi.get("/api/auth/providers")).data,
  register: async ({ email, password, name }) => {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },
  login: async ({ email, password }) => {
    // [이론: 계정·인증] 이메일로 확인할 계정을 지정하고 비밀번호를 증거로 제시합니다.
    // 비밀번호의 해시·솔트 처리와 저장값 대조는 Supabase Auth가 담당합니다.
    // 앱은 인증 서비스가 반환한 성공·실패를 처리합니다.
    const { data, error } = await requireSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  },
  logout: async () => {
    // [이론: 로그아웃·철회] local은 현재 세션을 대상으로 하는 로그아웃 범위입니다.
    // SDK가 보관 상태를 정리하고 해당 세션의 갱신 자격 철회를 요청합니다.
    // 이미 발급된 액세스 토큰은 만료 전까지 유효할 수 있습니다.
    const { error } = await requireSupabase().auth.signOut({ scope: "local" });
    if (error) throw error;
  },
  getCurrentUser: async () => (await api.get("/api/auth/me")).data,
  getAllUsers: async () => (await api.get("/api/users/all")).data,
  changeUserType: async (userId, userType) =>
    (await api.put(`/api/users/${userId}/type`, { userType })).data,
  updateProfile: async (payload) =>
    (await api.put("/api/users/profile", payload)).data,
  deactivateAccount: async () => (await api.delete("/api/users/account")).data,
  changePassword: async (currentPassword, password) => {
    const { error } = await requireSupabase().auth.updateUser({
      current_password: currentPassword,
      password,
    });
    if (error) throw error;
  },
  socialLogin: async (provider) => {
    if (!["google", "custom:naver"].includes(provider))
      throw new Error("지원하지 않는 로그인 방식입니다.");
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },
};
export { api as authAPI };
