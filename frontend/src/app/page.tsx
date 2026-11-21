import { AuthGuard } from "@/modules/auth/components/Guards";
import { CurrentUserName } from "@/modules/auth/components/CurrentUserName";
import { LogoutButton } from "@/modules/auth/components/LogoutButton";

export default function Home() {
  return (
    <AuthGuard>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">moviesync</h1>
          <div className="flex items-center gap-3 text-sm">
            <span>
              Hi, <CurrentUserName />
            </span>
            <LogoutButton />
          </div>
        </header>
      </main>
    </AuthGuard>
  );
}
