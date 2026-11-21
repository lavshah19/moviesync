"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ThemeToggle } from "@/modules/theme/components/ThemeToggle";

export function AuthView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isLogin = mode === "login";

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
        <h1 className="mb-1 text-2xl font-semibold">moviesync</h1>
        <p className="mb-6 text-sm text-zinc-500">{isLogin ? "Welcome back" : "Create your account"}</p>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <p className="mt-6 text-center text-sm text-zinc-500">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isLogin ? "register" : "login")}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            {isLogin ? "Register" : "Log in"}
          </button>
        </p>
      </div>
    </main>
  );
}
