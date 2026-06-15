// Registration screen for new CRM users.
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BrandMark } from "@/components/shared/BrandMark";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    };
    const created = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!created.ok) {
      const body = await created.json();
      setError(body.error ?? "Could not create account.");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: payload.email, password: payload.password, redirect: false });
    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="p-6 shadow-panel">
      <div className="mb-6">
        <BrandMark className="mb-6" />
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join the Kai &amp; Co. internal workspace for client and pipeline operations.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Name
          <Input className="mt-1" name="name" required minLength={2} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-1" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <Input className="mt-1" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link className="font-medium text-primary hover:text-red-700" href="/login">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
