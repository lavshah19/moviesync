"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

// Confirms the session with the backend once per page load (proxy.ts only checks the cookie exists).
function useSession() {
  const status = useAuthStore((s) => s.status);
  const loadUser = useAuthStore((s) => s.loadUser);
  useEffect(() => {
    if (useAuthStore.getState().status === "loading") loadUser();
  }, [loadUser]);
  return { status, retry: loadUser };
}

/** Renders children only for a logged-in user; otherwise sends them to /auth. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, retry } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
  }, [status, router]);
  // backend down: don't redirect (proxy would send them straight back here), offer a retry
  if (status === "error") {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p>Can&apos;t reach the server right now.</p>
        <button type="button" onClick={retry} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
          Try again
        </button>
      </div>
    );
  }
  return status === "authenticated" ? children : null;
}

/** Renders children only when logged out (login/register); otherwise sends them to /. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);
  // on "error" still show the form; submitting reports the server problem itself
  return status === "unauthenticated" || status === "error" ? children : null;
}
