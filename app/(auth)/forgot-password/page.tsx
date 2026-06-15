// Internal password recovery guidance until email reset tokens are wired.
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6 shadow-panel">
      <BrandMark className="mb-6" />
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-primary">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold">Reset access</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Ask a Kai &amp; Co. workspace admin to reset your password from Team settings. The admin can issue a temporary password and you can update it after signing in.
      </p>
      <div className="mt-6">
        <Link href="/login">
          <Button className="w-full">Back to sign in</Button>
        </Link>
      </div>
    </Card>
  );
}
