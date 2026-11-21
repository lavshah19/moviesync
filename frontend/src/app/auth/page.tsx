import type { Metadata } from "next";
import { AuthView } from "@/modules/auth/components/AuthView";
import { GuestGuard } from "@/modules/auth/components/Guards";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthPage() {
  return (
    <GuestGuard>
      <AuthView />
    </GuestGuard>
  );
}
