/* eslint-disable react-refresh/only-export-components -- useAuth와 Provider를 함께 제공합니다. */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authAPIService } from "../services/authApi";
import { supabase } from "../config/supabase";
const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider가 필요합니다.");
  return context;
};
const messageOf = (error) =>
  error.response?.data?.message || error.message || "인증 요청에 실패했습니다.";
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const queryClient = useQueryClient();
  const checkAuthStatus = useCallback(async () => {
    const response = await authAPIService.getCurrentUser();
    setUser(response.data.user);
    setAuthError("");
    return response.data.user;
  }, []);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;
    let generation = 0;
    let previousUserId;
    const applySession = async (session) => {
      if (!alive) return;
      const ticket = ++generation;
      if (session?.user.id !== previousUserId) {
        queryClient.clear();
        previousUserId = session?.user.id;
      }
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // [이론: 인증 결과] 브라우저에 세션이 남아 있어도 그 값만으로 앱 사용자를 확정하지 않습니다.
        // /me가 토큰을 검증해 확인한 사용자에 연결된 프로필을 화면의 사용자 상태로 사용합니다.
        const response = await authAPIService.getCurrentUser();
        if (alive && ticket === generation) {
          setUser(response.data.user);
          setAuthError("");
        }
      } catch (error) {
        if (alive && ticket === generation) {
          setUser(null);
          setAuthError(messageOf(error));
        }
      } finally {
        if (alive && ticket === generation) setLoading(false);
      }
    };
    // Auth 콜백의 SDK 잠금 밖에서 프로필을 읽습니다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      void applySession(data.session);
    });
    return () => {
      alive = false;
      generation++;
      subscription.unsubscribe();
    };
  }, [queryClient]);
  const login = async (credentials) => {
    try {
      await authAPIService.login(credentials);
    } catch (error) {
      // 가입 확인 대기 중에는 이메일 링크에 사용할 PKCE 검증값을 유지합니다.
      return { success: false, message: messageOf(error) };
    }
    try {
      await checkAuthStatus();
      return { success: true, message: "로그인되었습니다." };
    } catch (error) {
      await supabase?.auth.signOut({ scope: "local" });
      return { success: false, message: messageOf(error) };
    }
  };
  const register = async (data) => {
    try {
      const result = await authAPIService.register(data);
      if (result.session) await checkAuthStatus();
      return {
        success: true,
        needsConfirmation: !result.session,
        message: result.session
          ? "회원가입이 완료되었습니다."
          : "가입 확인 메일을 확인한 뒤 로그인하세요.",
      };
    } catch (error) {
      return { success: false, message: messageOf(error) };
    }
  };
  const logout = async () => {
    await authAPIService.logout();
    setUser(null);
    setAuthError("");
    // [이론: 상태 정리] 캐시 삭제는 이전 사용자의 화면 데이터를 정리하는 처리입니다.
    // 토큰의 갱신 자격 철회는 위에서 호출한 인증 서비스가 담당합니다.
    queryClient.clear();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        checkAuthStatus,
        isAdmin: () => user?.userType === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
