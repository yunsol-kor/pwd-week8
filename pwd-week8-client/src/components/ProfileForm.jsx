import React, { useState } from "react";
import styled from "@emotion/styled";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { authAPIService } from "../services/authApi";

const Form = styled.form`
  margin-top: 1.5rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: grid;
  gap: 0.75rem;
  label {
    font-weight: 600;
    color: #374151;
  }
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #b8c0ce;
    border-radius: 6px;
    font: inherit;
  }
  button {
    justify-self: start;
    background: #465ac3;
    color: white;
    border: 0;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font: inherit;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #606875;
    line-height: 1.5;
  }
`;

export default function ProfileForm() {
  const { user, checkAuthStatus } = useAuth();
  const [result, setResult] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: user.name },
  });
  const save = async (values) => {
    setResult("");
    try {
      await authAPIService.updateProfile({ name: values.name });
      const updated = await checkAuthStatus();
      reset({ name: updated.name });
      setResult("프로필을 저장했습니다.");
      toast.success("프로필을 저장했습니다.");
    } catch (error) {
      const message =
        error.userMessage || error.message || "프로필을 저장하지 못했습니다.";
      setResult(message);
      toast.error(message);
    }
  };
  return (
    <Form onSubmit={handleSubmit(save)} aria-label="프로필 수정">
      <label htmlFor="profile-name">표시 이름</label>
      {!user.email && (
        <p>
          계정에서 이메일을 제공하지 않았습니다. 표시 이름을 설정할 수 있습니다.
        </p>
      )}
      <input
        id="profile-name"
        autoComplete="name"
        aria-invalid={Boolean(errors.name)}
        aria-describedby={errors.name ? "profile-name-error" : undefined}
        {...register("name", {
          setValueAs: (value) => value.trim(),
          required: "이름을 입력하세요.",
          maxLength: { value: 80, message: "이름은 80자 이내로 입력하세요." },
        })}
      />
      {errors.name && (
        <p id="profile-name-error" role="alert">
          {errors.name.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "프로필 저장 중..." : "프로필 저장"}
      </button>
      <p role="status">{result}</p>
    </Form>
  );
}
