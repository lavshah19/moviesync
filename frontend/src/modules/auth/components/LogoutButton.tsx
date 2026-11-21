"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

export function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await logout();
        router.replace("/auth");
      }}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
    >
      Log out
    </button>
  );
}
