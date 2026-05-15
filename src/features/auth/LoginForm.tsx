"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Username 또는 password가 올바르지 않습니다.");
      return;
    }
    router.push("/home");
    router.refresh();
  };

  const filled = username.length > 0 && password.length > 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full">
      <Field
        label="Username"
        name="username"
        value={username}
        onChange={setUsername}
        autoComplete="username"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      <button
        type="submit"
        disabled={loading || !filled}
        className="mt-2 relative inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[color:var(--pay-on)] bg-pay shadow-[0_8px_22px_-12px_rgba(3,199,90,0.7)] disabled:opacity-40 disabled:cursor-not-allowed transition-[transform,filter,box-shadow] hover:brightness-105 hover:shadow-[0_12px_28px_-12px_rgba(3,199,90,0.8)] active:scale-[0.98]"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[color:var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const filled = value.length > 0;
  return (
    <label className="relative block">
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="peer block w-full rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 pt-5 pb-1.5 text-[14px] outline-none focus:border-[color:var(--foreground)]/40 transition-colors"
        placeholder=" "
      />
      <span
        className={`pointer-events-none absolute left-3 text-[color:var(--ink-soft)] transition-all ${
          filled
            ? "top-1 text-[10px] tracking-wider uppercase"
            : "top-3 text-[13px]"
        } peer-focus:top-1 peer-focus:text-[10px] peer-focus:tracking-wider peer-focus:uppercase`}
      >
        {label}
      </span>
    </label>
  );
}
