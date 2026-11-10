import { test } from "node:test";
import assert from "node:assert/strict";
import { completeAuthCallback, oauthCallbackError } from "../src/utils/oauthCallback.js";

test("정상 PKCE 복귀 코드를 로그인 오류로 처리하지 않는다", () => {
  assert.equal(oauthCallbackError("?code=single-use-code", ""), null);
});

test("공급자의 로그인 취소를 query와 hash 모두에서 인식한다", () => {
  assert.equal(
    oauthCallbackError("?error=access_denied", ""),
    "로그인이 취소되었습니다. 다시 시도하세요.",
  );
  assert.equal(
    oauthCallbackError("", "#error_code=user_cancelled"),
    "로그인이 취소되었습니다. 다시 시도하세요.",
  );
});

test("공급자의 원문 설명이나 토큰을 앱 복귀 URL에 옮기지 않는다", () => {
  const message = oauthCallbackError(
    "?error=server_error&error_description=refresh_token%3Dprivate-value",
    "#access_token=private-access",
  );
  assert.equal(message, "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.");
  assert.ok(!message.includes("private"));
});

test("잘못된 percent 인코딩이 포함되어도 로그인 화면을 깨뜨리지 않는다", () => {
  assert.equal(
    oauthCallbackError("?error=%E0%A4%A&error_description=100%", ""),
    "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.",
  );
});

test("오류 설명만 있는 복귀도 성공으로 간주하지 않는다", () => {
  assert.equal(
    oauthCallbackError("?error_description=failed", ""),
    "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.",
  );
});

const callback = (query) => new URL(`https://app.example/auth/callback${query}`);

test("이번 PKCE 코드로 새 세션을 발급한 경우에만 대시보드로 이동한다", async () => {
  const auth = {
    async exchangeCodeForSession(code) {
      assert.equal(code, "current-code");
      return { data: { session: { user: { id: "new-user" } } }, error: null };
    },
  };
  assert.equal(await completeAuthCallback(callback("?code=current-code"), auth), "/dashboard");
});

test("기존 세션이 있어도 만료·누락된 코드나 실패한 교환은 로그인 오류로 안내한다", async () => {
  const auth = {
    getSession: async () => ({ data: { session: { user: { id: "old-user" } } } }),
    exchangeCodeForSession: async () => ({
      data: { session: null },
      error: new Error("expired: private-code"),
    }),
  };
  for (const query of ["?code=expired", ""]) {
    const route = await completeAuthCallback(callback(query), auth);
    assert.match(route, /^\/login\?error=/);
    assert.doesNotMatch(route, /private-code/);
  }
});

test("공급자가 로그인을 취소하면 코드를 교환하지 않는다", async () => {
  let exchangeCalls = 0;
  const auth = {
    async exchangeCodeForSession() {
      exchangeCalls++;
      return { data: { session: null }, error: null };
    },
  };
  const route = await completeAuthCallback(callback("?code=unused#error=access_denied"), auth);
  assert.match(decodeURIComponent(route), /로그인이 취소/);
  assert.equal(exchangeCalls, 0);
});
