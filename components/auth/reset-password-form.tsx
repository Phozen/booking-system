"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  requestPasswordResetAction,
  type AuthActionResult,
} from "@/lib/auth/actions";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/auth/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";

export function ResetPasswordForm() {
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  const emailError = form.formState.errors.email?.message;

  function onSubmit(values: ResetPasswordValues) {
    const formData = new FormData();
    formData.set("email", values.email);

    startTransition(async () => {
      const actionResult = await requestPasswordResetAction(formData);
      setResult(actionResult);
    });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      {result ? (
          <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={getFieldDescribedBy(
            emailError && "reset-email-error",
          )}
          aria-invalid={Boolean(emailError)}
          {...form.register("email")}
        />
        <FormFieldError id="reset-email-error">{emailError}</FormFieldError>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        <PendingButtonContent pending={isPending} pendingLabel="Sending...">
          Send reset link
        </PendingButtonContent>
      </Button>

      <div className="grid gap-2 text-sm text-muted-foreground">
        <span>Remember your password?</span>
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Log in
        </Link>
      </div>
    </form>
  );
}
