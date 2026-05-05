"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginAction, type AuthActionResult } from "@/lib/auth/actions";
import { loginSchema, type LoginValues } from "@/lib/auth/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
        <Alert variant={result.status === "error" ? "destructive" : "default"}>
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
        {isPending ? "Logging in..." : "Log in"}
      </Button>

      <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
        <Link href="/reset-password" className="hover:text-foreground">
          Reset password
        </Link>
        <Link href="/register" className="hover:text-foreground">
          Create account
        </Link>
      </div>
    </form>
  );
}
