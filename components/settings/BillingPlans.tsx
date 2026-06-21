"use client";

import { useState } from "react";
import { Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    monthly: 0,
    description: "A focused workspace for validating the workflow.",
    features: ["1 workspace", "Core CRM", "Social scheduling", "30-day analytics"]
  },
  {
    name: "Growth",
    monthly: 49,
    description: "For teams connecting customer engagement to pipeline.",
    features: [
      "5 team seats",
      "Revenue command center",
      "Advanced analytics",
      "Webhooks and API keys"
    ],
    featured: true
  },
  {
    name: "Scale",
    monthly: 149,
    description: "For growing operators who need control and support.",
    features: [
      "Unlimited seats",
      "Priority support",
      "Custom integrations",
      "Extended data history"
    ]
  }
];

export function BillingPlans() {
  const [annual, setAnnual] = useState(true);
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-slate-950 p-5 text-white shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-red-300">Current plan</p>
            <h2 className="mt-2 text-xl font-semibold">Starter workspace</h2>
            <p className="mt-1 text-sm text-slate-300">
              Explore the complete CRM workflow before adding paid capacity.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                "focus-ring rounded px-3 py-1.5 text-xs font-semibold",
                !annual ? "bg-white text-slate-950" : "text-slate-300"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                "focus-ring rounded px-3 py-1.5 text-xs font-semibold",
                annual ? "bg-white text-slate-950" : "text-slate-300"
              )}
            >
              Annual · save 20%
            </button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
          return (
            <Card
              key={plan.name}
              className={cn(
                "relative flex flex-col",
                plan.featured && "border-primary ring-1 ring-primary/20"
              )}
            >
              {plan.featured ? (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Recommended
                </span>
              ) : null}
              <div>
                <p className="text-sm font-semibold text-slate-950">{plan.name}</p>
                <p className="mt-4 text-3xl font-bold text-slate-950">
                  ${price}
                  <span className="text-sm font-medium text-slate-500">/mo</span>
                </p>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
              </div>
              <ul className="my-5 flex-1 space-y-3 border-t pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant={plan.name === "Starter" ? "secondary" : "primary"} disabled>
                {plan.name === "Starter" ? "Current plan" : "Checkout coming soon"}
              </Button>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Secure billing</p>
            <p className="text-xs text-slate-500">
              Stripe-ready checkout and webhook architecture.
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-900">No surprise charges</p>
            <p className="text-xs text-slate-500">
              Plans stay inactive until payment credentials are configured.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
