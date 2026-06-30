"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginAction, type AuthActionResult } from "@/lib/auth/actions";
import { loginSchema, type LoginValues } from "@/lib/auth/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";

type LoginFormProps = {
  initialMessage?: string;
};

export function LoginForm({ initialMessage }: LoginFormProps) {
  const [result, setResult] = useState<AuthActionResult | null>(
    initialMessage ? { status: "error", message: initialMessage } : null,
  );
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  function onSubmit(values: LoginValues) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(async () => {
      const actionResult = await loginAction(formData);
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
            emailError && "login-email-error",
          )}
          aria-invalid={Boolean(emailError)}
          {...form.register("email")}
        />
        <FormFieldError id="login-email-error">{emailError}</FormFieldError>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-describedby={getFieldDescribedBy(
            passwordError && "login-password-error",
          )}
          aria-invalid={Boolean(passwordError)}
          {...form.register("password")}
        />
        <FormFieldError id="login-password-error">
          {passwordError}
        </FormFieldError>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        <PendingButtonContent pending={isPending} pendingLabel="Logging in...">
          Log in
        </PendingButtonContent>
      </Button>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/reset-password"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Reset password
        </Link>
        <Link
          href="/register"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Create account
        </Link>
      </div>
    </form>
  );
}
