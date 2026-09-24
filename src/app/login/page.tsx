"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(signIn, null);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, null);

  const isSignIn = mode === "signin";
  const state = isSignIn ? signInState : signUpState;
  const pending = isSignIn ? signInPending : signUpPending;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-1 text-2xl font-bold">🔖 북마크 매니저</h1>
        <p className="mb-6 text-sm text-zinc-500">
          {isSignIn ? "로그인하여 북마크를 관리하세요." : "새 계정을 만드세요."}
        </p>

        <form action={isSignIn ? signInAction : signUpAction} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="이메일"
            autoComplete="email"
            className="input"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="비밀번호 (6자 이상)"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="input"
          />

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state?.message && <p className="text-sm text-emerald-600">{state.message}</p>}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "처리 중..." : isSignIn ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(isSignIn ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {isSignIn ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </main>
  );
}
