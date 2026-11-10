import React, { useEffect, useRef } from "react";
import { supabase } from "../config/supabase";
import { completeAuthCallback } from "../utils/oauthCallback";

export default function AuthCallbackHandler() {
  const exchange = useRef(null);
  useEffect(() => {
    // StrictMode가 효과를 재실행해도 일회용 코드는 한 번만 교환합니다.
    exchange.current ??= completeAuthCallback(new URL(window.location.href), supabase?.auth);
    let active = true;
    exchange.current.then((route) => {
      if (active) window.location.replace(`/#${route}`);
    });
    return () => {
      active = false;
    };
  }, []);
  return <p role="status">로그인 확인 중...</p>;
}
