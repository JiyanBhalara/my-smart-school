// app/login/page.tsx
"use client";
import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <main className="flex flex-col gap-3 max-w-sm mx-auto p-6">
      <button
        onClick={() => signIn("google")}
        className="rounded bg-blue-500 text-white p-2"
      >
        Sign in with Google
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = (e.target as any).email.value;
          const password = (e.target as any).password.value;
          signIn("credentials", { email, password, callbackUrl: "/" });
        }}
        className="flex flex-col gap-2"
      >
        <input name="email" type="email" placeholder="Email" required className="border p-2" />
        <input name="password" type="password" placeholder="Password" required className="border p-2" />
        <button className="rounded bg-green-600 text-white p-2">Log in</button>
      </form>
    </main>
  );
}
