"use client";

import { useState, type CSSProperties } from "react";
import { ThemeToggle } from "@/modules/theme/components/ThemeToggle";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { AUTH_PANEL_BG, TicketPair } from "./TicketPair";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function AuthView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isLogin = mode === "login";

  return (
    <main className="relative grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <ThemeToggle className="absolute top-4 right-4 z-10" />

      <section
        aria-label="About moviesync"
        className={`flex flex-col justify-center gap-10 px-6 py-12 sm:px-12 lg:px-16 lg:py-16 ${AUTH_PANEL_BG}`}
      >
        <div className="max-w-md">
          <p className="enter text-sm font-medium text-rose-700 dark:text-rose-300">moviesync</p>
          <h1
            className="enter mt-3 font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl xl:text-7xl"
            style={delay(80)}
          >
            Movie picks <em className="text-rose-600 dark:text-rose-400">for each other</em>
          </h1>
          <p className="enter mt-4 text-zinc-600 dark:text-zinc-400" style={delay(160)}>
            You pick a film for them, they pick one for you. Watch it, tick it off, and keep the
            list of everything you&apos;ve shared.
          </p>
        </div>
        <TicketPair style={delay(260)} />
      </section>

      {/* Stacked (below lg): the form comes first on screen, the ticket panel under it.
          Only the visual order changes; the DOM keeps the h1 first for screen readers. */}
      <section className="order-first flex items-center justify-center px-6 pt-20 pb-12 sm:px-12 lg:order-none lg:py-12">
        <div className="enter w-full max-w-sm" style={delay(200)}>
          <h2 className="font-display text-4xl leading-tight">
            {isLogin ? "Your seat is saved" : "Take your seat"}
          </h2>
          <p className="mt-1 mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            {isLogin
              ? "Log in to see what's been picked for you."
              : "Two seats, one for each of you. Pick yours."}
          </p>

          {isLogin ? <LoginForm /> : <RegisterForm />}

          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isLogin ? "First time here?" : "Already have a seat?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "register" : "login")}
              className="font-medium text-rose-700 underline decoration-rose-300 underline-offset-4 transition-colors duration-150 hover:decoration-rose-600 dark:text-rose-300 dark:decoration-rose-800 dark:hover:decoration-rose-400"
            >
              {isLogin ? "Book your seat" : "Find your seat"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
