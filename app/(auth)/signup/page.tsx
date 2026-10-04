"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { goto } from "@/lib/navigate";

function SignupForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      // SPA navigation (with a hard-nav safety net) — session cookie + context
      // are already set by register().
      goto(router, next);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        if (!Object.keys(err.errors).length) toast(err.message, "error");
      } else {
        toast("Could not create your account.", "error");
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-brand-800">Create your account</h1>
        <p className="mt-1 text-sm text-ink-soft">It only takes a minute.</p>
      </div>

      <Field label="Full name" required error={errors.name?.[0]}>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} required autoComplete="name" />
      </Field>
      <Field label="Email" required error={errors.email?.[0]}>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" />
      </Field>
      <Field label="Phone number" error={errors.phone?.[0]} hint="So we can reach you about delivery.">
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="080..." autoComplete="tel" />
      </Field>
      <Field label="Password" required error={errors.password?.[0]}>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirm password" required>
        <Input
          type="password"
          value={form.password_confirmation}
          onChange={(e) => set("password_confirmation", e.target.value)}
          required
          autoComplete="new-password"
        />
      </Field>

      <Button type="submit" fullWidth size="lg" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
