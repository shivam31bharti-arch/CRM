// Login screen for credential-based authentication.
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BrandMark } from "@/components/shared/BrandMark";

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
    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="p-6 shadow-panel">
      <div className="mb-6">
        <BrandMark className="mb-6" />
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage Kai &amp; Co. relationships, deals, and team activity.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-1" name="email" type="email" required autoComplete="email" />
        </label>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <Link className="text-sm font-medium text-primary hover:text-red-700" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <Input id="password" className="mt-1" name="password" type="password" required minLength={8} autoComplete="current-password" />
        </div>
        {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Checking credentials..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{" "}
        <Link className="font-medium text-primary hover:text-red-700" href="/register">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
