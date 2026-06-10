// Login screen for credential-based authentication.
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage your sales and social pipeline.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-1" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <Input className="mt-1" name="password" type="password" required minLength={8} autoComplete="current-password" />
        </label>
        {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{" "}
        <Link className="font-medium text-blue-700" href="/register">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
