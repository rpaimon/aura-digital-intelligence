import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111318] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            Aura Digital Fiji
          </p>
          <h1 className="mt-3 text-3xl font-black">Intelligence Newsroom</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
