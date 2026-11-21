import type { Metadata } from "next";
import { AuthView } from "@/modules/auth/components/AuthView";

export const metadata: Metadata = { title: "Sign in · moviesync" };

export default function AuthPage() {
  return <AuthView />;
}
