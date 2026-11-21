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
      className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium transition duration-150 hover:-translate-y-px hover:border-rose-300 hover:text-rose-700 active:translate-y-0 active:scale-[0.98] dark:border-zinc-700 dark:hover:border-rose-800 dark:hover:text-rose-300"
    >
      Log out
    </button>
  );
}
