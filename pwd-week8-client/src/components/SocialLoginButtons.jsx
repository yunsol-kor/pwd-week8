import React, { useState } from "react";
import styled from "@emotion/styled";
import { useQuery } from "@tanstack/react-query";
import { FaGoogle } from "react-icons/fa";
import { SiNaver } from "react-icons/si";
import { toast } from "react-toastify";
import { authAPIService } from "../services/authApi";
import { authConfigured } from "../config/supabase";

const Container = styled.section`
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.25rem;
`;
const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  min-height: 46px;
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid
    ${(props) => (props.$kind === "naver" ? "#03a94d" : "#d1d5db")};
  border-radius: 8px;
  background: ${(props) => (props.$kind === "naver" ? "#03a94d" : "#fff")};
  color: ${(props) => (props.$kind === "naver" ? "#fff" : "#1f2937")};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 3px solid #667eea;
    outline-offset: 3px;
  }
`;
const Message = styled.p`
  margin: 0.3rem 0 0;
  color: #606875;
  font-size: 0.85rem;
  line-height: 1.5;
`;
const RetryButton = styled.button`
  background: none;
  border: 0;
  color: #465ac3;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
`;

export default function SocialLoginButtons() {
  const [redirecting, setRedirecting] = useState(null);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["auth-providers"],
    queryFn: authAPIService.getProviders,
    staleTime: 60_000,
    retry: false,
  });
  const providers = data?.data;
  const login = async (provider) => {
    setRedirecting(provider);
    try {
      await authAPIService.socialLogin(provider);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRedirecting(null);
    }
  };
  return (
    <Container aria-label="소셜 로그인">
      <Message>또는 다른 계정으로 로그인</Message>
      {[
        {
          key: "google",
          label: "Google",
          icon: <FaGoogle aria-hidden="true" />,
        },
        { key: "naver", label: "네이버", icon: <SiNaver aria-hidden="true" /> },
      ].map(({ key, label, icon }) => {
        const ready =
          authConfigured && !isError && providers?.[key]?.enabled === true;
        return (
          <div key={key}>
            <Button
              type="button"
              $kind={key}
              disabled={!ready || Boolean(redirecting)}
              onClick={() => login(providers[key].provider)}
              aria-busy={redirecting === providers?.[key]?.provider}
            >
              {icon}
              {redirecting === providers?.[key]?.provider
                ? "로그인 화면으로 이동 중..."
                : `${label}로 로그인`}
            </Button>
            {!isPending && !isError && !ready && (
              <Message>{label} 로그인은 현재 사용할 수 없습니다.</Message>
            )}
          </div>
        );
      })}
      <div aria-live="polite">
        {isPending && <Message>소셜 로그인 상태를 확인하고 있습니다.</Message>}
        {isError && (
          <Message>
            소셜 로그인 상태를 확인하지 못했습니다. 이메일 로그인을 이용하거나
            다시 시도하세요.
          </Message>
        )}
        {!isPending && (
          <RetryButton
            type="button"
            disabled={isFetching || Boolean(redirecting)}
            onClick={() => refetch()}
          >
            {isFetching ? "확인 중..." : "로그인 상태 다시 확인"}
          </RetryButton>
        )}
      </div>
    </Container>
  );
}
