import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthGuard } from "@/modules/auth/components/Guards";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";
import { MovieBoard } from "@/modules/movie/components/MovieBoard";
import { ThemeToggle } from "@/modules/theme/components/ThemeToggle";

export default function Home() {
  return (
    <AuthGuard>
      {/* md+: the page is exactly one screen tall and each column scrolls inside itself */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-8 md:h-dvh md:flex-none">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="rounded-md transition-opacity duration-150 hover:opacity-80">
            <Logo height={40} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex flex-1 flex-col pt-6 pb-16 sm:pt-10 md:min-h-0 md:pb-8">
          <MovieBoard />
        </main>
      </div>
    </AuthGuard>
  );
}
