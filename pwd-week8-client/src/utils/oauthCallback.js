// 공급자 오류 설명에는 토큰·식별자가 섞일 수 있으므로 그대로 URL에 옮기지 않습니다.
export function oauthCallbackError(search = "", hash = "") {
  for (const value of [search.replace(/^\?/, ""), hash.replace(/^#/, "")]) {
    const params = new URLSearchParams(value);
    const errors = [params.get("error"), params.get("error_code")];
    if (!errors.some(Boolean) && !params.has("error_description")) continue;
    if (
      errors.some((error) =>
        ["access_denied", "user_cancelled"].includes(error),
      )
    ) {
      return "로그인이 취소되었습니다. 다시 시도하세요.";
    }
    return "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.";
  }
  return null;
}

// 현재 URL에 발급된 일회용 코드의 교환 결과만 로그인 성공으로 인정합니다.
export async function completeAuthCallback(url, auth) {
  const providerError = oauthCallbackError(url.search, url.hash);
  if (providerError) return `/login?error=${encodeURIComponent(providerError)}`;

  const code = url.searchParams.get("code");
  if (code && auth) {
    try {
      const { data, error } = await auth.exchangeCodeForSession(code);
      if (!error && data.session) return "/dashboard";
    } catch {
      // 네트워크나 SDK 오류의 원문에도 자격증명이 포함될 수 있습니다.
    }
  }
  return `/login?error=${encodeURIComponent("인증을 완료하지 못했습니다. 다시 로그인하세요.")}`;
}
