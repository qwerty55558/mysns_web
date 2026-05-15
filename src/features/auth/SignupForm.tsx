"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { signIn } from "next-auth/react";
import { graphql } from "@/gql";

const RegisterMutation = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        username
        displayName
      }
    }
  }
`);

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function validateUsername(v: string): string | null {
  if (v.length === 0) return "ID를 입력해 주세요.";
  if (v.length < 3) return "3자 이상이어야 합니다.";
  if (v.length > 32) return "32자 이하여야 합니다.";
  if (!USERNAME_RE.test(v)) return "영문·숫자·_ 만 사용할 수 있어요.";
  return null;
}

function validateDisplayName(v: string): string | null {
  if (v.trim().length === 0) return "이름을 입력해 주세요.";
  if (v.length > 32) return "32자 이하여야 합니다.";
  return null;
}

function validatePassword(v: string): string | null {
  if (v.length === 0) return "비밀번호를 입력해 주세요.";
  if (v.length < 6) return "6자 이상이어야 합니다.";
  return null;
}

type FieldName = "username" | "displayName" | "password";

export function SignupForm() {
  const router = useRouter();
  const [registerMutation, { loading: registering }] = useMutation(RegisterMutation);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [signingIn, setSigningIn] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(
    () => ({
      username: serverErrors.username ?? validateUsername(username),
      displayName: serverErrors.displayName ?? validateDisplayName(displayName),
      password: serverErrors.password ?? validatePassword(password),
    }),
    [username, displayName, password, serverErrors],
  );

  const showConfirm = password.length > 0;
  const passwordConfirmError = !showConfirm
    ? null
    : passwordConfirm.length === 0
      ? "비밀번호를 한 번 더 입력해 주세요."
      : passwordConfirm !== password
        ? "비밀번호가 일치하지 않습니다."
        : null;

  const allValid =
    !errors.username &&
    !errors.displayName &&
    !errors.password &&
    !passwordConfirmError;

  const onTouch = (name: string) => setTouched((t) => ({ ...t, [name]: true }));

  const clearServerError = (name: FieldName) => {
    setServerErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const onUsernameChange = (v: string) => {
    setUsername(v);
    clearServerError("username");
  };
  const onDisplayNameChange = (v: string) => {
    setDisplayName(v);
    clearServerError("displayName");
  };
  const onPasswordChange = (v: string) => {
    setPassword(v);
    clearServerError("password");
    if (v.length === 0) {
      setPasswordConfirm("");
      setTouched((t) => ({ ...t, passwordConfirm: false }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      username: true,
      displayName: true,
      password: true,
      passwordConfirm: true,
    });
    if (!allValid) return;
    setSubmitError(null);
    setServerErrors({});

    try {
      await registerMutation({
        variables: {
          input: {
            username: username.trim(),
            password,
            displayName: displayName.trim(),
          },
        },
      });
    } catch (err) {
      handleRegisterError(err, {
        setServerErrors,
        setSubmitError,
        setTouched,
      });
      return;
    }

    setSigningIn(true);
    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });
    setSigningIn(false);

    if (result?.error) {
      setSubmitError("가입은 완료됐는데 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.");
      return;
    }

    router.push("/home");
    router.refresh();
  };

  const submitting = registering || signingIn;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full">
      <Field
        label="ID"
        name="username"
        value={username}
        onChange={onUsernameChange}
        onBlur={() => onTouch("username")}
        autoComplete="username"
        error={touched.username || serverErrors.username ? errors.username : null}
      />
      <Field
        label="이름"
        name="displayName"
        value={displayName}
        onChange={onDisplayNameChange}
        onBlur={() => onTouch("displayName")}
        autoComplete="nickname"
        error={touched.displayName || serverErrors.displayName ? errors.displayName : null}
      />
      <Field
        label="비밀번호"
        name="password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        onBlur={() => onTouch("password")}
        autoComplete="new-password"
        error={touched.password || serverErrors.password ? errors.password : null}
      />

      <div
        aria-hidden={!showConfirm}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          showConfirm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <Field
            label="비밀번호 확인"
            name="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            onBlur={() => onTouch("passwordConfirm")}
            autoComplete="new-password"
            error={touched.passwordConfirm ? passwordConfirmError : null}
            disabled={!showConfirm}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!allValid || submitting}
        className="mt-2 relative inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[color:var(--pay-on)] bg-pay shadow-[0_8px_22px_-12px_rgba(3,199,90,0.7)] disabled:opacity-40 disabled:cursor-not-allowed transition-[transform,filter,box-shadow] hover:brightness-105 hover:shadow-[0_12px_28px_-12px_rgba(3,199,90,0.8)] active:scale-[0.98]"
      >
        {submitting ? "Creating account…" : "가입하기"}
      </button>
      {submitError && (
        <p role="alert" className="text-sm text-[color:var(--danger)]">
          {submitError}
        </p>
      )}
    </form>
  );
}

function handleRegisterError(
  err: unknown,
  ctx: {
    setServerErrors: React.Dispatch<
      React.SetStateAction<Partial<Record<FieldName, string>>>
    >;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
    setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  },
) {
  if (CombinedGraphQLErrors.is(err)) {
    const fieldErrors: Partial<Record<FieldName, string>> = {};
    const generic: string[] = [];
    for (const ge of err.errors) {
      const field = ge.extensions?.field;
      if (
        field === "username" ||
        field === "displayName" ||
        field === "password"
      ) {
        if (!fieldErrors[field]) fieldErrors[field] = ge.message;
      } else {
        generic.push(ge.message);
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      ctx.setServerErrors(fieldErrors);
      ctx.setTouched((t) => ({
        ...t,
        ...Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])),
      }));
    }
    if (generic.length > 0) {
      ctx.setSubmitError(generic.join("\n"));
    } else if (Object.keys(fieldErrors).length === 0) {
      ctx.setSubmitError(err.message || "가입에 실패했습니다.");
    }
    return;
  }
  ctx.setSubmitError(
    err instanceof Error ? err.message : "가입에 실패했습니다.",
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  error,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  error?: string | null;
  disabled?: boolean;
}) {
  const filled = value.length > 0;
  const hasError = Boolean(error);
  return (
    <div className="flex flex-col gap-1 pb-1">
      <label className="relative block">
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={hasError}
          tabIndex={disabled ? -1 : undefined}
          className={`peer block w-full rounded-md border bg-[color:var(--paper)] px-3 pt-5 pb-1.5 text-[14px] outline-none transition-colors disabled:opacity-50 ${
            hasError
              ? "border-[color:var(--danger)] focus:border-[color:var(--danger)]"
              : "border-[color:var(--rule)] focus:border-[color:var(--foreground)]/40"
          }`}
          placeholder=" "
        />
        <span
          className={`pointer-events-none absolute left-3 transition-all ${
            hasError ? "text-[color:var(--danger)]" : "text-[color:var(--ink-soft)]"
          } ${
            filled
              ? "top-1 text-[10px] tracking-wider uppercase"
              : "top-3 text-[13px]"
          } peer-focus:top-1 peer-focus:text-[10px] peer-focus:tracking-wider peer-focus:uppercase`}
        >
          {label}
        </span>
      </label>
      {hasError && (
        <p className="px-1 text-[11.5px] text-[color:var(--danger)]">{error}</p>
      )}
    </div>
  );
}
