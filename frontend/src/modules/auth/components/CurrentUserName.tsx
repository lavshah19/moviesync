"use client";

import { useAuthStore } from "../store/auth.store";

export function CurrentUserName() {
  const user = useAuthStore((s) => s.user);
  return <>{user?.fullName ?? user?.email}</>;
}
